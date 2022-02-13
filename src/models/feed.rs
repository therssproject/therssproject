use serde::{Deserialize, Serialize};
use validator::Validate;
use wither::bson::{doc, oid::ObjectId};
use wither::Model as WitherModel;
use feed_rs;

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
#[model(index(keys = r#"doc!{ "user": 1 }"#))]
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
pub enum FeedType {
  Atom,
  Json,
  RSS0,
  RSS1,
  RSS2,
}

impl From<feed_rs::model::FeedType> for  FeedType {
    fn from(feed_type: feed_rs::model::FeedType) -> Self {
        match feed_type {
            feed_rs::model::FeedType::Atom => FeedType::Atom,
            feed_rs::model::FeedType::JSON => FeedType::Json,
            feed_rs::model::FeedType::RSS0 => FeedType::RSS0,
            feed_rs::model::FeedType::RSS1 => FeedType::RSS1,
            feed_rs::model::FeedType::RSS2 => FeedType::RSS2
        }
    }
}
