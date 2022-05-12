use bson::doc;
use bson::oid::ObjectId;
use chrono::{Duration, Utc};
use futures::future;
use futures::stream;
use futures::StreamExt;
use lazy_static::lazy_static;
use tokio::time::sleep;
use tracing::error;
use tracing::info;
use wither::ModelCursor as Cursor;
use wither::WitherError;

use crate::errors::Error;
use crate::lib::database_model::ModelExt;
use crate::messenger::Messenger;
use crate::models::feed::Feed;
use crate::models::subscription::Subscription;

lazy_static! {
  static ref SCHEDULER_INTERVAL: Duration = Duration::minutes(5);
}

pub fn start(messenger: Messenger) {
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

      let res = feeds
        .filter_map(parse)
        .map(sync_feed)
        .buffer_unordered(concurrency)
        // Filter out feeds that failed to sync.
        .filter_map(|feed_id| future::ready(feed_id))
        .map(|feed_id| async move {
          let cursor = match find_subscription(feed_id).await {
            Ok(cursor) => cursor,
            Err(error) => {
              error!("Failed to fetch subscriptions for feed: {}", error);
              return None;
            }
          };

          Some(())
        });
        // .then(find_subscription)
        // .map(|sa| {
        //   let subscription = 
        // });
      // .flat_map(|feed_id| Subscription::cursor(doc! { "feed": feed_id }, None));
      // .flat_map(|feed_id| stream::iter(page));

      // let res = feeds
      //   .filter_map(parse)
      //   .map(sync_feed)
      //   .buffer_unordered(concurrency)
      //   // Filter out feeds that failed to sync.
      //   .filter(|feed_id| future::ready(feed_id.is_some()))
      //   // .flat_map(|feed_id| stream::iter(page));

      // // TODO: Crear funcion que se encargue de todo esto, sino ya es un kilombo
      // .then(|feed_id| Subscription::cursor(doc! { "feed": feed_id }, None))
      // // .buffer_unordered(concurrency)
      // .flatten()
      // // .flatten()
      // .filter_map(|feed| {
      //   let result = match feed {
      //     Ok(feed) => Some(feed),
      //     Err(err) => {
      //       error!(
      //         "Failed to parse MongoDB document into Feed model: {:?}",
      //         err
      //       );
      //       None
      //     }
      //   };
      //   async move { result }
      // })
      // .for_each_concurrent(concurrency, |subscription| {
      //   let messenger = messenger.clone();
      //   let id = subscription.id.unwrap();

      //   async move {
      //     messenger
      //       .publish("send_webhook_event", id.bytes().as_ref())
      //       .await
      //       .unwrap();
      //   }
      // })
      // .await;

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

async fn find_subscription(feed_id: ObjectId) -> Result<Cursor<Subscription>, Error> {
  let query = doc! { "feed": feed_id };
  Subscription::cursor(query, None).await
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
      return None;
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

// async fn queue_jobs (cursor: Result<Cursor<Subscription>, Error>) -> Result<ObjectId, Error> {
//   let cursor = match cursor {
//     Ok(cursor) =>
//   };
// }
