use feed_rs::model::Entry as RawEntry;
use serde::{Deserialize, Serialize};
use validator::Validate;
use wither::bson::{doc, oid::ObjectId};
use wither::mongodb::options::InsertManyOptions;
use wither::Model as WitherModel;

use crate::errors::Error;
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

  /// This function tries to insert as many entries as possible. When a write
  /// fails, continue with the remaining writes, if any.
  pub async fn try_insert_many(entries: Vec<Entry>) -> Result<i32, Error> {
    let insert_options = InsertManyOptions::builder().ordered(false).build();
    let _result = Self::insert_many(entries, insert_options).await;

    // TODO: Return the actual count of inserted entries.
    Ok(1)
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

// TODO: Move this to a separate file where the conversion between raw feed and
// feed happens
impl From<RawEntry> for PublicEntry {
  fn from(entry: RawEntry) -> Self {
    let url = entry.links.get(0).map(|link| link.href.clone());
    let title = entry.title.clone().map(|title| title.content);
    let description = entry.summary.clone().map(|summary| summary.content);
    let published_at = entry.published.map(|published| published.into());

    Self {
      url,
      title,
      description,
      published_at,
    }
  }
}
