use axum::AddExtensionLayer;
use axum::Router;
use bson::doc;
use http::header;
use std::net::SocketAddr;
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
mod models;
mod routes;
mod settings;

use context::Context;
use database::Database;
use logger::Logger;
use models::subscription::Subscription;
use models::ModelExt;
use settings::Settings;

#[tokio::main]
async fn main() {
  let settings = match Settings::new() {
    Ok(value) => value,
    Err(err) => panic!("Failed to setup configuration. Error: {}", err),
  };

  Logger::setup(&settings);

  let db = match Database::setup(&settings).await {
    Ok(value) => value,
    Err(_) => panic!("Failed to setup database connection"),
  };

  let context = Context::new(db, settings.clone());

  let app = Router::new()
    .merge(routes::user::create_route())
    .merge(routes::subscription::create_route())
    .merge(routes::feed::create_route())
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
    .layer(AddExtensionLayer::new(context.clone()));

  let port = settings.server.port;
  let address = SocketAddr::from(([127, 0, 0, 1], port));

  let context = context.clone();
  tokio::spawn(async move {
    use tokio::time::{sleep, Duration};

    loop {
      info!("Running scheduler");

      let subscriptions = context
        .models
        .subscription
        .find(doc! {}, None)
        .await
        .unwrap()
        .into_iter()
        .map(Into::into)
        .collect::<Vec<Subscription>>();

      for subscription in subscriptions {
        dbg!("About to parse {:?}", &subscription.url);
        let url = subscription.url.clone();
        let feed = lib::parse_rss::parse_rss(url).await;
        println!("Feed {:#?}", feed);
      }

      // TODO: Push to a queue that will handle these jobs
      sleep(Duration::from_millis(5_000_000)).await;
    }
  });

  info!("listening on {}", &address);
  axum::Server::bind(&address)
    .serve(app.into_make_service())
    .await
    .expect("Failed to start server");
}
