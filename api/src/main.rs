use http::header;
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;
use tower_http::{
  compression::CompressionLayer, propagate_header::PropagateHeaderLayer,
  sensitive_headers::SetSensitiveHeadersLayer, trace,
};
use tracing::info;

mod database;
mod errors;
mod feed_scheduler;
mod lib;
mod logger;
mod messenger;
mod models;
mod routes;
mod settings;
mod subscription_scheduler;

#[tokio::main]
async fn main() {
  logger::setup();

  database::setup()
    .await
    .expect("Failed to setup database connection");

  models::sync_indexes()
    .await
    .expect("Failed to sync database indexes");

  messenger::setup().await.expect("Failed to setup messenger");

  models::subscription_job::setup()
    .await
    .expect("Failed to setup subscription job");

  let app = routes::create_router()
    // TODO change to production CORS before going live
    // @reference https://docs.rs/tower-http/latest/tower_http/cors/struct.CorsLayer.html#method.permissive
    .layer(CorsLayer::permissive())
    // High level logging of requests and responses
    .layer(
      trace::TraceLayer::new_for_http()
        .make_span_with(trace::DefaultMakeSpan::new().include_headers(true))
        .on_request(trace::DefaultOnRequest::new().level(tracing::Level::INFO))
        .on_response(trace::DefaultOnResponse::new().level(tracing::Level::INFO)),
    )
    // Mark the `Authorization` request header as sensitive so it doesn't
    // show in logs.
    .layer(SetSensitiveHeadersLayer::new(std::iter::once(
      header::AUTHORIZATION,
    )))
    // Compress responses
    .layer(CompressionLayer::new())
    // Propagate `X-Request-Id`s from requests to responses
    .layer(PropagateHeaderLayer::new(header::HeaderName::from_static(
      "x-request-id",
    )));

  let settings = settings::get_settings();
  let port = settings.server.port;
  let address = SocketAddr::from(([0, 0, 0, 0], port));

  info!("Starting schedulers");
  feed_scheduler::start();
  subscription_scheduler::start();

  info!("listening on {}", &address);
  axum::Server::bind(&address)
    .serve(app.into_make_service())
    .await
    .expect("Failed to start server");
}
