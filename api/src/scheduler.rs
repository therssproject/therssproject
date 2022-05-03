use crate::lib::database_model::ModelExt;
use bson::doc;
use futures::stream;
use futures::StreamExt;
use tokio::time::{sleep, Duration};
use tracing::info;

use crate::messenger::Messenger;
use crate::models::feed::Feed;
use crate::models::subscription::Subscription;

pub fn start(messenger: Messenger) {
  tokio::spawn(async move {
    loop {
      info!("Running scheduler");

      let concurrency = 100;
      // TODO: Retrieve only the Feed ID from the database.
      Feed::cursor(doc! {}, None)
        .await
        .unwrap()
        .map(|feed| {
          let feed = feed.unwrap();
          let id = feed.id.unwrap();
          let url = feed.url;

          async move {
            info!("Syncing feed with ID {} and URL {}", &id, url);
            // TODO: Sync should return if there was a new entry to the feed,
            // based on that we should queue the subscriptions from this feed
            // for notification sending.
            Feed::sync(id).await.unwrap();
            id
          }
        })
        .buffer_unordered(concurrency)
        .map(|feed_id| {
          async move {
            // TODO: We should just return the cursor instead of getting the
            // subscriptions into an array and then converting it to a stream.
            let subscriptions = Subscription::find(doc! { "feed": feed_id }, None)
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

      sleep(Duration::from_secs(60 * 5)).await;
    }
  });
}
