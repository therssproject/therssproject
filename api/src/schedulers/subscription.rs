use bson::doc;
use chrono::Duration;
use futures::StreamExt;
use std::time::Instant;
use tokio::time::sleep;
use tracing::error;
use tracing::info;
use wither::mongodb::options::FindOptions;
use wither::ModelCursor as Cursor;
use wither::WitherError;

use crate::errors::Error;
use crate::lib::database_model::ModelExt;
use crate::models::subscription::Subscription;

pub fn start() {
  tokio::spawn(run_job());
}

async fn run_job() {
  loop {
    info!("Running subscription scheduler");

    let start = Instant::now();
    let subscriptions = match find_subscriptions().await {
      Ok(subscriptions) => subscriptions,
      Err(error) => {
        error!("Failed to fetch subscriptions cursor: {}", error);
        // Something went wrong try again in a bit.
        sleep(Duration::seconds(1).to_std().unwrap()).await;
        continue;
      }
    };

    let concurrency = 5;
    subscriptions
      .filter_map(parse)
      .for_each_concurrent(concurrency, notify)
      .await;

    let duration = start.elapsed();
    info!(
      "Finished running subscription scheduler elapsed={:.0?}",
      duration
    );

    // We currently have a small amount of feeds. Once we have a decent amount
    // of feeds we can start running this job continuously.
    sleep(Duration::seconds(10).to_std().unwrap()).await;
  }
}

async fn find_subscriptions() -> Result<Cursor<Subscription>, Error> {
  let options = FindOptions::builder()
    .sort(doc! { "scheduled_at": 1_i32 })
    .limit(1_000)
    .build();

  let query = doc! {
    "scheduled_at": {
      "$exists": true
    }
  };

  Subscription::cursor(query, Some(options)).await
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

async fn notify(subscription: Subscription) {
  let id = subscription.id.unwrap();
  let result = subscription.notify().await;
  if let Err(error) = result {
    error!("Failed to notify subscription {}. Error: {}", id, error);
  }
}
