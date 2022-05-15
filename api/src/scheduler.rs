use bson::doc;
use bson::oid::ObjectId;
use chrono::{Duration, Utc};
use futures::future;
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
use crate::models::feed::Feed;
use crate::models::subscription::Subscription;

lazy_static! {
  static ref SCHEDULER_INTERVAL: Duration = Duration::minutes(5);
}

pub fn start() {
  let messenger = get_messenger();

  tokio::spawn(async move {
    loop {
      info!("Running scheduler");

      let concurrency = 100;
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
        .map(sync_feed)
        .buffer_unordered(concurrency)
        // Filter out feeds that failed to sync.
        .filter_map(future::ready)
        .for_each_concurrent(concurrency, |feed_id| async move {
          let cursor = Subscription::cursor(doc! { "feed": feed_id }, None).await;
          let cursor = match cursor {
            Ok(cursor) => cursor,
            Err(error) => {
              error!(
                "Failed to fetch subscriptions for feed: {}. Error {}",
                feed_id, error
              );
              return;
            }
          };

          cursor
            .for_each(|subscription| {
              let subscription = subscription.unwrap();
              let id = subscription.id.unwrap();
              async move {
                messenger
                  .publish("send_webhook_event", id.bytes().as_ref())
                  .await
                  .unwrap();
              }
            })
            .await;
          // TODO: Update feed last sync attribute.
        })
        .await;

      sleep(SCHEDULER_INTERVAL.to_std().unwrap()).await;
    }
  });
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

async fn sync_feed(feed: Feed) -> Option<ObjectId> {
  let id = feed.id.unwrap();
  let url = feed.url;

  info!("Syncing feed with ID {} and URL {}", &id, url);
  // TODO: Sync should return if there was a new entry to the feed, based on
  // that we should queue the subscriptions from this feed for notification
  // sending.
  match Feed::sync(id).await {
    Ok(_) => Some(id),
    Err(error) => {
      error!("Failed to sync Feed with ID {:?}. Error: {}", id, error);
      None
    }
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
