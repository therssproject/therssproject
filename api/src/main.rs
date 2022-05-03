use axum::extract::Extension;
use http::header;
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;
use tower_http::{
  compression::CompressionLayer, propagate_header::PropagateHeaderLayer,
  sensitive_headers::SetSensitiveHeadersLayer, trace,
};
use tracing::info;

mod context;
mod database;
mod errors;
mod lib;
mod logger;
mod messenger;
mod models;
mod routes;
mod scheduler;
mod settings;

use context::Context;
use database::Database;
use logger::Logger;
use messenger::Messenger;
use models::Models;
use settings::Settings;

#[tokio::main]
async fn main() {
  let settings = match Settings::new() {
    Ok(value) => value,
    Err(err) => panic!("Failed to setup configuration {}", err),
  };

  Logger::setup(&settings);

  let db = match Database::setup(&settings).await {
    Ok(value) => value,
    Err(err) => panic!("Failed to setup database connection {}", err),
  };

  let messenger = match Messenger::setup(&settings).await {
    Ok(value) => value,
    Err(err) => panic!("Failed to setup message broker connection {}", err),
  };

  let models = match Models::setup(db.clone(), messenger.clone()).await {
    Ok(value) => value,
    Err(err) => panic!("Failed to setup models {}", err),
  };

  let context = Context::new(settings.clone(), models.clone());

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
    )))
    .layer(Extension(context.clone()));

  let port = settings.server.port;
  let address = SocketAddr::from(([0, 0, 0, 0], port));

  info!("Starting scheduler");
  scheduler::start(models.clone(), messenger.clone());

  info!("listening on {}", &address);
  axum::Server::bind(&address)
    .serve(app.into_make_service())
    .await
    .expect("Failed to start server");
}
