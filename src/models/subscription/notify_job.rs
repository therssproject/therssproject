use lapin::message::DeliveryResult;
use lapin::options::BasicAckOptions;
use tracing::{error, info};

use crate::errors::Error;
use crate::messenger::Messenger;

pub async fn setup(messenger: Messenger) -> Result<(), Error> {
  let queue_name = "send_webhook_event";
  let _queue = messenger.create_queue(queue_name).await.unwrap();
  let consumer = messenger.create_consumer(queue_name).await.unwrap();

  consumer.set_delegate(move |delivery: DeliveryResult| async move {
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

    // Do work

    delivery
      .ack(BasicAckOptions::default())
      .await
      .expect("Failed to ack send_webhook_event message");
  });

  Ok(())
}
