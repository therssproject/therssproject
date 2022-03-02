use lapin::{Channel, Connection, ConnectionProperties};
use std::sync::Arc;
use tokio_amqp::LapinTokioExt;

use crate::settings::Settings;

// #[derive(Clone)]
pub struct Rabbitmq {
  pub conn: Arc<Connection>,
  pub channel: Arc<Channel>,
}

impl Rabbitmq {
  pub async fn setup(settings: &Settings) -> Result<Self, lapin::Error> {
    let uri = settings.rabbitmq.uri.as_str();
    let options = ConnectionProperties::default().with_tokio();
    let conn = Connection::connect(uri, options).await?;
    let channel = conn.create_channel().await?;

    let conn = Arc::new(conn);
    let channel = Arc::new(channel);

    Ok(Self { conn, channel })
  }

  pub fn get_channel(&self) -> Arc<Channel> {
    self.channel.clone()
  }
}
