use crate::lib::database_model::ModelExt;
use bson::doc;
use futures::stream;
use futures::StreamExt;
use tracing::info;

use crate::messenger::Messenger;
use crate::models::Models;

pub fn start(models: Models, messenger: Messenger) {
  tokio::spawn(async move {
    use tokio::time::{sleep, Duration};

    loop {
      info!("Running scheduler");

      let concurrency = 100;
      models
        .feed
        // TODO: Retrieve only the Feed ID from the database.
        .cursor(doc! {}, None)
        .await
        .unwrap()
        .map(|feed| {
          let models = models.clone();
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
          let models = models.clone();

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
}
