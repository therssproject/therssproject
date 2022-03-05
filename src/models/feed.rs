use bson::serde_helpers::bson_datetime_as_rfc3339_string;
use bson::serde_helpers::serialize_object_id_as_hex_string;
use feed_rs;
use serde::{Deserialize, Serialize};
use tracing::debug;
use tracing::error;
use validator::Validate;
use wither::bson::{doc, oid::ObjectId};
use wither::mongodb::options::InsertManyOptions;
use wither::Model as WitherModel;

use crate::database::Database;
use crate::errors::Error;
use crate::errors::NotFound;
use crate::lib::database_model::ModelExt;
use crate::lib::date::{now, Date};
use crate::lib::fetch_rss::fetch_rss;
use crate::models::entry::Entry;
use crate::models::entry::Model as EntryModel;

#[derive(Clone)]
pub struct Model {
  pub db: Database,
  pub entry: EntryModel,
}

impl Model {
  pub fn new(db: Database) -> Self {
    let entry = EntryModel::new(db.clone());
    Self { db, entry }
  }

  pub async fn sync(&self, id: ObjectId) -> Result<(), Error> {
    debug!("Syncing feed");

    let feed = self.find_by_id(&id).await?;
    let feed = match feed {
      Some(feed) => feed,
      None => {
        error!("Failed to sync, Feed with ID {} not found", &id);
        return Err(Error::NotFound(NotFound::new("feed")));
      }
    };

    let url = feed.url;
    let raw_feed = fetch_rss(url.clone()).await;
    let entries = raw_feed
      .entries
      .into_iter()
      .map(|raw_entry| Entry::from_raw_entry(id, raw_entry))
      .collect::<Vec<Entry>>();

    // When a write fails, continue with the remaining writes, if any.
    // TODO: Check if there is a non duplicate failure and report. Duplicate
    // failures are expected when the feed is updated.
    let insert_options = InsertManyOptions::builder().ordered(false).build();
    let _result = self.entry.insert_many(entries, insert_options).await;

    self
      .update_one(
        doc! { "_id": &id },
        doc! { "$set": { "synced_at": now() } },
        None,
      )
      .await?;

    Ok(())
  }
}

impl ModelExt for Model {
  type T = Feed;
  fn get_database(&self) -> &Database {
    &self.db
  }
}

// TODO: Get struct values from:
// https://docs.rs/feed-rs/latest/feed_rs/model/struct.Feed.html
#[derive(Debug, Clone, Serialize, Deserialize, WitherModel, Validate)]
#[model(index(keys = r#"doc!{ "url": 1 }"#, options = r#"doc!{ "unique": true }"#))]
pub struct Feed {
  #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
  pub id: Option<ObjectId>,
  pub public_id: String,
  pub feed_type: FeedType,
  pub url: String,
  pub title: Option<String>,
  pub updated_at: Date,
  pub created_at: Date,
  pub synced_at: Date,
}

impl Feed {
  pub fn new(public_id: String, feed_type: FeedType, url: String, title: Option<String>) -> Self {
    let now = now();
    Self {
      id: None,
      public_id,
      feed_type,
      url,
      title,
      updated_at: now,
      created_at: now,
      synced_at: now,
    }
  }

  pub async fn from_url(url: String) -> Self {
    let raw_feed = fetch_rss(url.clone()).await;
    Self::new(raw_feed.id, FeedType::from(raw_feed.feed_type), url, None)
  }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum FeedType {
  Atom,
  Json,
  RSS0,
  RSS1,
  RSS2,
}

impl From<feed_rs::model::FeedType> for FeedType {
  fn from(feed_type: feed_rs::model::FeedType) -> Self {
    match feed_type {
      feed_rs::model::FeedType::Atom => FeedType::Atom,
      feed_rs::model::FeedType::JSON => FeedType::Json,
      feed_rs::model::FeedType::RSS0 => FeedType::RSS0,
      feed_rs::model::FeedType::RSS1 => FeedType::RSS1,
      feed_rs::model::FeedType::RSS2 => FeedType::RSS2,
    }
  }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PublicFeed {
  #[serde(alias = "_id", serialize_with = "serialize_object_id_as_hex_string")]
  pub id: ObjectId,
  pub public_id: String,
  pub feed_type: FeedType,
  pub url: String,
  pub title: Option<String>,
  #[serde(with = "bson_datetime_as_rfc3339_string")]
  pub updated_at: Date,
  #[serde(with = "bson_datetime_as_rfc3339_string")]
  pub created_at: Date,
}

impl From<Feed> for PublicFeed {
  fn from(feed: Feed) -> Self {
    Self {
      id: feed.id.expect("PublicFeed From<Feed> expects an id"),
      public_id: feed.public_id,
      feed_type: feed.feed_type,
      url: feed.url,
      title: feed.title,
      updated_at: feed.updated_at,
      created_at: feed.created_at,
    }
  }
}
