use bson::oid::ObjectId;
use lapin::message::DeliveryResult;
use lapin::options::BasicAckOptions;
use tracing::{error, info};

use crate::errors::Error;
use crate::messenger::get_messenger;
use crate::models::subscription::Subscription;

pub async fn setup() -> Result<(), Error> {
  let messenger = get_messenger();
  let queue_name = "send_webhook";
  let _queue = messenger.create_queue(queue_name).await.unwrap();
  let consumer = messenger.create_consumer(queue_name).await.unwrap();

  consumer.set_delegate(move |delivery: DeliveryResult| async move {
    info!("Processing send_webhook message");

    let delivery = match delivery {
      // Carries the delivery alongside its channel
      Ok(Some(delivery)) => delivery,
      // The consumer got canceled
      Ok(None) => return,
      // Carries the error and is always followed by Ok(None)
      Err(error) => {
        error!("Failed to consume send_webhook message {}", error);
        return;
      }
    };

    // TODO: Create a struct to represent the message payload.
    let data = delivery.data.clone();
    let data: [u8; 12] = match data.as_slice().try_into() {
      Ok(value) => value,
      Err(_) => {
        error!("Failed to parse send_webhook payload");
        return;
      }
    };

    let subscription_id = ObjectId::from_bytes(data);

    info!("Notifying subscription with ID {}", &subscription_id);
    Subscription::notify(subscription_id).await.unwrap();

    delivery
      .ack(BasicAckOptions::default())
      .await
      .expect("Failed to ack send_webhook message");
  });

  Ok(())
}
