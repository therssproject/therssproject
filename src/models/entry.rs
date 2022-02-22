use feed_rs::model::Entry as RawEntry;
use serde::{Deserialize, Serialize};
use validator::Validate;
use wither::bson::{doc, oid::ObjectId};
use wither::Model as WitherModel;

use crate::database::Database;
use crate::lib::date::now;
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
  type T = Entry;
  fn get_database(&self) -> &Database {
    &self.db
  }
}

// TODO: Get struct values from:
// https://docs.rs/feed-rs/latest/feed_rs/model/struct.Entry.html
#[derive(Debug, Clone, Serialize, Deserialize, WitherModel, Validate)]
#[model(index(keys = r#"doc!{ "feed": 1 }"#))]
#[model(index(
  keys = r#"doc!{ "feed": 1, "public_id": 1 }"#,
  options = r#"doc!{ "unique": true }"#
))]
pub struct Entry {
  #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
  pub id: Option<ObjectId>,
  pub feed: ObjectId,
  pub public_id: String,
  pub title: Option<String>,
  pub created_at: Date,
}

impl Entry {
  pub fn from_raw_entry(feed: ObjectId, raw_entry: RawEntry) -> Self {
    Self {
      id: None,
      feed,
      public_id: raw_entry.id,
      title: None,
      created_at: now(),
    }
  }
}
