use axum::AddExtensionLayer;
use axum::Router;
use bson::doc;
use futures::stream::{self, StreamExt};
use futures::FutureExt;
use http::header;
use std::net::SocketAddr;
use tower_http::{
  compression::CompressionLayer, propagate_header::PropagateHeaderLayer,
  sensitive_headers::SetSensitiveHeadersLayer, trace,
};
use tracing::{debug, error, info};

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

  // TODO: This is not pretty nice. Find a better way to do this.
  context
    .models
    .user
    .sync_indexes()
    .await
    .expect("Failed to sync indexes");
  context
    .models
    .subscription
    .sync_indexes()
    .await
    .expect("Failed to sync indexes");
  context
    .models
    .feed
    .sync_indexes()
    .await
    .expect("Failed to sync indexes");
  context
    .models
    .entry
    .sync_indexes()
    .await
    .expect("Failed to sync indexes");
  context
    .models
    .webhook
    .sync_indexes()
    .await
    .expect("Failed to sync indexes");

  let app = Router::new()
    .merge(routes::user::create_route())
    .merge(routes::subscription::create_route())
    .merge(routes::feed::create_route())
    .merge(routes::webhook::create_route())
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
      // let context = context.clone();

      let concurrency = 50;
      context
        .models
        .feed
        .find(doc! {}, None)
        .into_stream()
        .flat_map_unordered(concurrency, |feeds| stream::iter(feeds.unwrap()))
        .for_each_concurrent(concurrency, |feed| async move {
          let id = feed.id.unwrap();
          let url = feed.url.clone();
          match feed.sync().await {
            Ok(_) => debug!("Synced feed {:?} with URL: {:?}", id, url),
            Err(err) => error!("Failed to sync feed {:?}: {:?}", id, err),
          }
        })
        .await;

      // TODO: Push to a queue that will handle these jobs
      sleep(Duration::from_millis(5_000)).await;
    }
  });

  info!("listening on {}", &address);
  axum::Server::bind(&address)
    .serve(app.into_make_service())
    .await
    .expect("Failed to start server");
}
