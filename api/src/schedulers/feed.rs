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
use crate::models::feed::Feed;
use crate::utils::database_model::ModelExt;

pub fn start() {
  tokio::spawn(run_job());
}

async fn run_job() {
  loop {
    info!("Running feed scheduler");

    let start = Instant::now();
    let concurrency = 4;
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

    let duration = start.elapsed();
    info!("Finished running feed scheduler elapsed={:.0?}", duration);

    // We currently have a small amount of feeds. Once we have a decent amount
    // of feeds we can start running this job continuously.
    sleep(Duration::seconds(10).to_std().unwrap()).await;
  }
}

async fn find_feeds() -> Result<Cursor<Feed>, Error> {
  let options = FindOptions::builder()
    .sort(doc! { "synced_at": 1_i32 })
    .limit(5_000)
    .build();

  Feed::cursor(doc! {}, Some(options)).await
}

async fn sync_feed(feed: Feed) {
  let id = feed.id.unwrap();
  let result = Feed::sync(id).await;
  if let Err(err) = result {
    error!("Failed to sync Feed {:?}. Error: {}", id, err);
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
