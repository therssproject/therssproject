use feed_rs::model::Entry as RawEntry;
use serde::{Deserialize, Serialize};
use validator::Validate;
use wither::bson::{doc, oid::ObjectId};
use wither::Model as WitherModel;

use crate::lib::database_model::ModelExt;
use crate::lib::date::now;
use crate::lib::date::Date;
use crate::lib::serde::bson_datetime_option_as_rfc3339_string;

impl ModelExt for Entry {
  type T = Entry;
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
  pub url: Option<String>,
  pub title: Option<String>,
  pub description: Option<String>,
  pub published_at: Option<Date>,
  pub created_at: Date,
}

impl Entry {
  pub fn from_raw_entry(feed: ObjectId, raw_entry: RawEntry) -> Self {
    let url = raw_entry.links.get(0).map(|link| link.href.clone());

    let title = raw_entry.title.clone().map(|title| title.content);
    let description = raw_entry.summary.clone().map(|summary| summary.content);
    let published_at = raw_entry.published.map(|published| published.into());

    Self {
      id: None,
      feed,
      public_id: raw_entry.id,
      url,
      title,
      description,
      published_at,
      created_at: now(),
    }
  }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PublicEntry {
  pub url: Option<String>,
  pub title: Option<String>,
  pub description: Option<String>,
  #[serde(serialize_with = "bson_datetime_option_as_rfc3339_string")]
  pub published_at: Option<Date>,
}

impl From<Entry> for PublicEntry {
  fn from(entry: Entry) -> Self {
    Self {
      url: entry.url,
      title: entry.title,
      description: entry.description,
      published_at: entry.published_at,
    }
  }
}
