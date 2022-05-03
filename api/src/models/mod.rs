pub mod application;
pub mod endpoint;
pub mod entry;
pub mod feed;
pub mod subscription;
pub mod subscription_job;
pub mod user;
pub mod webhook;

use crate::errors::Error;
use crate::lib::database_model::ModelExt;

pub async fn sync_indexes() -> Result<(), Error> {
  application::Application::sync_indexes().await?;
  endpoint::Endpoint::sync_indexes().await?;
  entry::Entry::sync_indexes().await?;
  feed::Feed::sync_indexes().await?;
  subscription::Subscription::sync_indexes().await?;
  user::User::sync_indexes().await?;
  webhook::Webhook::sync_indexes().await?;

  Ok(())
}
