use bson::oid::ObjectId;
use lapin::message::DeliveryResult;
use lapin::options::BasicAckOptions;
use tracing::{error, info};

use crate::errors::Error;
use crate::messenger::Messenger;
use crate::models::subscription::Model as SubscriptionModel;

pub async fn setup(subscription: SubscriptionModel, messenger: Messenger) -> Result<(), Error> {
  let queue_name = "send_webhook_event";
  let _queue = messenger.create_queue(queue_name).await.unwrap();
  let consumer = messenger.create_consumer(queue_name).await.unwrap();

  consumer.set_delegate(move |delivery: DeliveryResult| {
    let subscription = subscription.clone();

    async move {
      info!("Processing send_webhook_event message");

      let delivery = match delivery {
        // Carries the delivery alongside its channel
        Ok(Some(delivery)) => delivery,
        // The consumer got canceled
        Ok(None) => return,
        // Carries the error and is always followed by Ok(None)
        Err(error) => {
          error!("Failed to consume send_webhook_event message {}", error);
          return;
        }
      };

      // TODO: Create a struct to represent the message payload.
      let data = delivery.data.clone();
      let data: [u8; 12] = match data.as_slice().try_into() {
        Ok(value) => value,
        Err(_) => {
          error!("Failed to parse send_webhook_event payload");
          return;
        }
      };

      let subscription_id = ObjectId::from_bytes(data);

      info!("Syncing subscription with ID {}", &subscription_id);
      subscription.notify(subscription_id).await.unwrap();

      delivery
        .ack(BasicAckOptions::default())
        .await
        .expect("Failed to ack send_webhook_event message");
    }
  });

  Ok(())
}
