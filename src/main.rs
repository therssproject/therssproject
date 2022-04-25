use axum::extract::Extension;
use bson::doc;
use futures::stream;
use futures::StreamExt;
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
mod settings;

use context::Context;
use database::Database;
use lib::database_model::ModelExt;
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
  let address = SocketAddr::from(([127, 0, 0, 1], port));

  tokio::spawn(async move {
    use tokio::time::{sleep, Duration};

    loop {
      info!("Running scheduler");

      let concurrency = 100;
      context
        .models
        .feed
        // TODO: Retrieve only the Feed ID from the database.
        .cursor(doc! {}, None)
        .await
        .unwrap()
        .map(|feed| {
          let models = context.models.clone();
          let feed = feed.unwrap();
          let id = feed.id.unwrap();
          let url = feed.url;

          async move {
            info!("Syncing feed with ID {} and URL {}", &id, url);
            // TODO: Sync should return if there was a new entry to the feed,
            // based on that we should queue the subscriptions from this feed
            // for notification sending.
            models.feed.sync(id).await.unwrap();
            id
          }
        })
        .buffer_unordered(concurrency)
        .map(|feed_id| {
          let models = context.models.clone();

          async move {
            // TODO: We should just return the cursor instead of getting the
            // subscriptions into an array and then converting it to a stream.
            let subscriptions = models
              .subscription
              .find(doc! { "feed": feed_id }, None)
              .await
              .unwrap();

            stream::iter(subscriptions)
          }
        })
        .buffer_unordered(concurrency)
        .flatten()
        .for_each_concurrent(concurrency, |subscription| {
          let messenger = messenger.clone();
          let id = subscription.id.unwrap();

          async move {
            messenger
              .publish("send_webhook_event", id.bytes().as_ref())
              .await
              .unwrap();
          }
        })
        .await;

      sleep(Duration::from_millis(5_000_000)).await;
    }
  });

  info!("listening on {}", &address);
  axum::Server::bind(&address)
    .serve(app.into_make_service())
    .await
    .expect("Failed to start server");
}
