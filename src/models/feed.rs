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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FeedType {
  Atom,
  Json,
  RSS0,
  RSS1,
  RSS2,
}
