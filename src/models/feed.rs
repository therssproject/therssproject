use bson::serde_helpers::bson_datetime_as_rfc3339_string;
use bson::serde_helpers::serialize_object_id_as_hex_string;
use feed_rs;
use serde::{Deserialize, Serialize};
use validator::Validate;
use wither::bson::{doc, oid::ObjectId};
use wither::Model as WitherModel;

use crate::database::Database;
use crate::lib::date::Date;
use crate::models::ModelExt;

#[derive(Clone)]
pub struct Model {
  pub db: Database,
}

impl Model {
  pub fn new(db: Database) -> Self {
    Self { db }
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
}

impl Feed {
  pub fn new(public_id: String, feed_type: FeedType, url: String, title: Option<String>) -> Self {
    let now = Date::now();
    Self {
      id: None,
      public_id,
      feed_type,
      url,
      title,
      updated_at: now,
      created_at: now,
    }
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
