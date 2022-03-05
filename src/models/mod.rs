pub mod entry;
pub mod event;
pub mod feed;
pub mod subscription;
pub mod user;
pub mod webhook;

use crate::Database;
use crate::Messenger;
use crate::{errors::Error, lib::database_model::ModelExt};

#[derive(Clone)]
pub struct Models {
  pub user: user::Model,
  pub subscription: subscription::Model,
  pub feed: feed::Model,
  pub entry: entry::Model,
  pub webhook: webhook::Model,
}

impl Models {
  pub async fn setup(db: Database, messenger: Messenger) -> Result<Self, Error> {
    let user = user::Model::new(db.clone());
    let subscription = subscription::Model::setup(db.clone(), messenger.clone()).await;
    let feed = feed::Model::new(db.clone());
    let entry = entry::Model::new(db.clone());
    let webhook = webhook::Model::new(db);

    let this = Self {
      user,
      subscription,
      feed,
      entry,
      webhook,
    };

    this.sync_indexes().await?;
    Ok(this)
  }

  pub async fn sync_indexes(&self) -> Result<(), Error> {
    self.user.sync_indexes().await?;
    self.subscription.sync_indexes().await?;
    self.feed.sync_indexes().await?;
    self.entry.sync_indexes().await?;
    self.webhook.sync_indexes().await?;

    Ok(())
  }
}
