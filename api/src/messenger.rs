use lapin::options::BasicConsumeOptions;
use lapin::publisher_confirm::Confirmation;
use lapin::Consumer;
use lapin::Error;
use lapin::Queue;
use lapin::{options::QueueDeclareOptions, types::FieldTable};
use lapin::{Channel, Connection, ConnectionProperties};

use crate::settings::get_settings;

static mut MESSENGER: Option<Messenger> = None;

pub async fn setup() -> Result<(), lapin::Error> {
  unsafe {
    if MESSENGER.is_some() {
      panic!("Messenger already initialized");
    }
  };

  let messenger = Messenger::setup().await?;
  unsafe {
    MESSENGER = Some(messenger);
  };

  Ok(())
}

pub fn get_messenger() -> &'static Messenger {
  unsafe { MESSENGER.as_ref().expect("Messenger not initialized") }
}

pub struct Messenger {
  pub connection: Connection,
  pub channel: Channel,
}

impl Messenger {
  pub async fn setup() -> Result<Self, lapin::Error> {
    let settings = get_settings();
    let uri = settings.rabbitmq.uri.as_str();

    let options = ConnectionProperties::default()
      .with_executor(tokio_executor_trait::Tokio::current())
      .with_reactor(tokio_reactor_trait::Tokio);

    let connection = Connection::connect(uri, options).await?;
    let channel = connection.create_channel().await?;

    Ok(Self {
      connection,
      channel,
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
