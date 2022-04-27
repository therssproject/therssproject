pub mod application;
pub mod endpoint;
pub mod entry;
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
  pub application: application::Model,
  pub subscription: subscription::Model,
  pub feed: feed::Model,
  pub entry: entry::Model,
  pub endpoint: endpoint::Model,
}

impl Models {
  pub async fn setup(db: Database, messenger: Messenger) -> Result<Self, Error> {
    let user = user::Model::new(db.clone());
    let application = application::Model::new(db.clone());
    let subscription = subscription::Model::setup(db.clone(), messenger.clone()).await;
    let feed = feed::Model::new(db.clone());
    let entry = entry::Model::new(db.clone());
    let endpoint = endpoint::Model::new(db);

    let this = Self {
      user,
      application,
      subscription,
      feed,
      entry,
      endpoint,
    };

    this.sync_indexes().await?;
    Ok(this)
  }

  pub async fn sync_indexes(&self) -> Result<(), Error> {
    self.user.sync_indexes().await?;
    self.application.sync_indexes().await?;
    self.subscription.sync_indexes().await?;
    self.feed.sync_indexes().await?;
    self.entry.sync_indexes().await?;
    self.endpoint.sync_indexes().await?;

    Ok(())
  }
}
