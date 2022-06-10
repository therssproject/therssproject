use bson::doc;
use chrono::Duration;
use futures::StreamExt;
use lazy_static::lazy_static;
use tokio::time::sleep;
use tracing::error;
use tracing::info;
use wither::ModelCursor as Cursor;
use wither::WitherError;

use crate::errors::Error;
use crate::lib::database_model::ModelExt;
use crate::messenger::get_messenger;
use crate::models::subscription::Subscription;

lazy_static! {
  static ref SCHEDULER_INTERVAL: Duration = Duration::seconds(10);
}

pub fn start() {
  tokio::spawn(run_job());
}

async fn run_job() {
  loop {
    info!("Running subscription scheduler");

    let concurrency = 50;
    let subscriptions = match find_subscriptions().await {
      Ok(subscriptions) => subscriptions,
      Err(error) => {
        error!("Failed to fetch subscriptions cursor: {}", error);
        // Something went wrong try again in a bit.
        sleep(Duration::seconds(1).to_std().unwrap()).await;
        continue;
      }
    };

    subscriptions
      .filter_map(parse)
      .for_each_concurrent(concurrency, queue_send_webhook_job)
      .await;

    sleep(SCHEDULER_INTERVAL.to_std().unwrap()).await;
  }
}

async fn find_subscriptions() -> Result<Cursor<Subscription>, Error> {
  let query = doc! {
    "scheduled_at": {
      "$exists": true
    }
  };

  Subscription::cursor(query, None).await
}

async fn parse(subscription: Result<Subscription, WitherError>) -> Option<Subscription> {
  match subscription {
    Ok(subscription) => Some(subscription),
    Err(err) => {
      error!(
        "Failed to parse MongoDB document into Subscription model: {:?}",
        err
      );
      None
    }
  }
}

async fn queue_send_webhook_job(subscription: Subscription) {
  let messenger = get_messenger();
  let id = subscription.id.unwrap();

  messenger
    .publish("send_webhook", id.bytes().as_ref())
    .await
    .unwrap();
}
