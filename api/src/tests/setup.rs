use bson::doc;
use lazy_static::lazy_static;
use std::future::Future;
use std::net::SocketAddr;
use tokio::net::TcpStream;
use tokio::runtime::Runtime;
use tokio::time::sleep;
use tokio::time::Duration;

use crate::create_app;
use crate::models::application::Application;
use crate::models::endpoint::Endpoint;
use crate::models::entry::Entry;
use crate::models::feed::Feed;
use crate::models::key::Key;
use crate::models::subscription::Subscription;
use crate::models::user::User;
use crate::models::webhook::Webhook;
use crate::settings::get_settings;
use crate::utils::database_model::ModelExt;

lazy_static! {
  static ref RUNTIME: Runtime = Runtime::new().expect("Failed to create Tokio runtime");
}

/// Use the static tokio runtime to start the APP, wait for the server to listen
/// on the specified port, run tests and then clean up the database. Tokio test
/// runtime (tokio::test) is not used to avoid starting the app again on each
/// test. Arguably this would be a better approach, but this API is statless
/// (Without considering the database), so there is no point on starting a new
/// instance on each test. Make sure to run tests sequentially (cargo test -- --test-threads=1)
/// to avoid inconsistency with the Database.
/// Read more: https://github.com/tokio-rs/tokio/issues/2374
pub fn with_app<F: Future>(test: F) -> F::Output {
  std::env::set_var("RUN_MODE", "test");
  RUNTIME.block_on(async move {
    let is_app_running = is_app_running().await;

    if !is_app_running {
      tokio::spawn(start_app());
      wait_for_app_to_start().await.unwrap();
    }

    cleanup_database().await;
    test.await
  })
}

async fn start_app() {
  let app = create_app().await;
  let settings = get_settings();
  let port = settings.server.port;
  let address = SocketAddr::from(([127, 0, 0, 1], port));

  axum::Server::bind(&address)
    .serve(app.into_make_service())
    .await
    .expect("Failed to start server");
}

async fn wait_for_app_to_start() -> Result<(), &'static str> {
  for _ in 0..2000 {
    let is_running = is_app_running().await;
    if is_running {
      return Ok(());
    }
    sleep(Duration::from_millis(10)).await;
  }

  Err("Could not connect to APP")
}

async fn is_app_running() -> bool {
  let settings = get_settings();
  let port = settings.server.port;
  let address = SocketAddr::from(([127, 0, 0, 1], port));
  let is_running = TcpStream::connect(address).await.is_ok();

  is_running
}

async fn cleanup_database() {
  Application::delete_many(doc! {}).await.unwrap();
  Endpoint::delete_many(doc! {}).await.unwrap();
  Entry::delete_many(doc! {}).await.unwrap();
  Feed::delete_many(doc! {}).await.unwrap();
  Key::delete_many(doc! {}).await.unwrap();
  Subscription::delete_many(doc! {}).await.unwrap();
  User::delete_many(doc! {}).await.unwrap();
  Webhook::delete_many(doc! {}).await.unwrap();
}
