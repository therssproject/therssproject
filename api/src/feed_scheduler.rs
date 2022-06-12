use bson::doc;
use chrono::{Duration, Utc};
use futures::StreamExt;
use lazy_static::lazy_static;
use tokio::time::sleep;
use tracing::error;
use tracing::info;
use wither::ModelCursor as Cursor;
use wither::WitherError;

use crate::errors::Error;
use crate::lib::database_model::ModelExt;
use crate::models::feed::Feed;

lazy_static! {
  static ref SCHEDULER_INTERVAL: Duration = Duration::minutes(5);
}

pub fn start() {
  tokio::spawn(run_job());
}

async fn run_job() {
  loop {
    info!("Running feed scheduler");

    let concurrency = 50;
    let feeds = match find_feeds().await {
      Ok(feeds) => feeds,
      Err(error) => {
        error!("Failed to fetch feeds cursor: {}", error);
        // Something went wrong try again in a bit.
        sleep(Duration::seconds(1).to_std().unwrap()).await;
        continue;
      }
    };

    feeds
      .filter_map(parse)
      .for_each_concurrent(concurrency, sync_feed)
      .await;

    sleep(SCHEDULER_INTERVAL.to_std().unwrap()).await;
  }
}

async fn find_feeds() -> Result<Cursor<Feed>, Error> {
  let lower_than = Utc::now() - *SCHEDULER_INTERVAL;
  let query = doc! {
    "synced_at": {
      "$lt": lower_than
    }
  };

  Feed::cursor(query, None).await
}

async fn sync_feed(feed: Feed) {
  let id = feed.id.unwrap();
  let url = feed.url;

  info!("Syncing feed with ID {} and URL {}", &id, url);
  let result = Feed::sync(id).await;
  if let Err(err) = result {
    error!("Failed to sync Feed with ID {:?}. Error: {}", id, err);
  }
}

async fn parse(feed: Result<Feed, WitherError>) -> Option<Feed> {
  match feed {
    Ok(feed) => Some(feed),
    Err(err) => {
      error!(
        "Failed to parse MongoDB document into Feed model: {:?}",
        err
      );
      None
    }
  }
}
