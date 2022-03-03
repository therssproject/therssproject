use lapin::options::BasicConsumeOptions;
use lapin::publisher_confirm::Confirmation;
use lapin::Consumer;
use lapin::Error;
use lapin::Queue;
use lapin::{options::QueueDeclareOptions, types::FieldTable};
use lapin::{Channel, Connection, ConnectionProperties};
use std::ops::Deref;
use std::sync::Arc;

use crate::settings::Settings;

#[derive(Clone)]
pub struct Messenger {
  inner: Arc<MessengerInner>,
}

impl Deref for Messenger {
  type Target = Arc<MessengerInner>;
  fn deref(&self) -> &Self::Target {
    &self.inner
  }
}

pub struct MessengerInner {
  pub conn: Connection,
  pub channel: Channel,
}

impl Messenger {
  pub async fn setup(settings: &Settings) -> Result<Self, lapin::Error> {
    let uri = settings.rabbitmq.uri.as_str();

    let options = ConnectionProperties::default()
      .with_executor(tokio_executor_trait::Tokio::current())
      .with_reactor(tokio_reactor_trait::Tokio);

    let conn = Connection::connect(uri, options).await?;
    let channel = conn.create_channel().await?;

    Ok(Self {
      inner: Arc::new(MessengerInner { conn, channel }),
    })
  }

  pub async fn create_queue<T>(&self, name: T) -> Result<Queue, Error>
  where
    T: AsRef<str>,
  {
    self
      .channel
      .queue_declare(
        name.as_ref(),
        QueueDeclareOptions::default(),
        FieldTable::default(),
      )
      .await
  }

  pub async fn create_consumer<T>(&self, queue_name: T) -> Result<Consumer, Error>
  where
    T: AsRef<str>,
  {
    self
      .channel
      .basic_consume(
        queue_name.as_ref(),
        // TODO: Investigate about this tag argument.
        "",
        BasicConsumeOptions::default(),
        FieldTable::default(),
      )
      .await
  }

  pub async fn publish<T>(&self, queue_name: T, payload: &[u8]) -> Result<Confirmation, Error>
  where
    T: AsRef<str>,
  {
    self
      .channel
      .basic_publish(
        "",
        queue_name.as_ref(),
        lapin::options::BasicPublishOptions::default(),
        payload,
        lapin::BasicProperties::default(),
      )
      .await
      .unwrap()
      .await
  }
}
