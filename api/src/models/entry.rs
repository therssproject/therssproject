use feed_rs::model::Entry as RawEntry;
use futures::{stream, StreamExt};
use lazy_static::lazy_static;
use serde::{Deserialize, Serialize};
use tracing::{info, warn};
use validator::Validate;
use wither::bson::{doc, oid::ObjectId};
use wither::mongodb::options::FindOneOptions;
use wither::mongodb::options::UpdateOptions;
use wither::Model as WitherModel;

use crate::errors::Error;
use crate::lib::database_model::ModelExt;
use crate::lib::date::now;
use crate::lib::date::Date;
use crate::lib::serde::bson_datetime_option_as_rfc3339_string;

lazy_static! {
  static ref SORT_DESC: FindOneOptions = FindOneOptions::builder().sort(doc! { "_id": -1 }).build();
}

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

  /// Order is extremely important, entries should be sorted chronologically
  /// (From oldest to newest). The biggest MongoDB ID will end up being the most
  /// recent feed entry.
  pub async fn sync(feed: &ObjectId, entries: Vec<Entry>) -> Result<bool, Error> {
    if entries.is_empty() {
      return Ok(false);
    }

    let entries_count: u64 = entries
      .len()
      .try_into()
      .expect("Failed to convert entries len to u64");

    info!("Upserting {} new entries to feed {}", entries.len(), feed);
    stream::iter(entries)
      // This is done sequential because we depend on the insertion order. We do
      // not use the insert_many function because it does not allow to insert
      // docs in order and skip duplicates. This can be improved in the future
      // using a bulk insert.
      .for_each(|entry| async move {
        let public_id = entry.public_id.clone();
        let query = doc! { "feed": feed, "public_id": &public_id };
        let options = UpdateOptions::builder().upsert(true).build();
        let update = bson::to_document(&entry).expect("Failed to convert entry to BSON Document");
        let update = doc! { "$set": update };
        let res = <Entry as ModelExt>::update_one(query, update, Some(options)).await;
        if let Err(err) = res {
          // TODO: Check error and make sure the error is a duplicate key error.
          // Otherwise, we should stop the operation.
          warn!(
            "Error inserting entry with public ID {} to feed {}. Error: {}",
            public_id, &feed, err
          );
        }
      })
      .await;

    // Remove outdated entries from the database.
    let options = FindOneOptions::builder()
      .sort(doc! { "_id": -1_i32 })
      .skip(Some(entries_count))
      .build();
    let query = doc! { "feed": feed };
    let entry = <Entry as ModelExt>::find_one(query, options.into()).await?;

    let removed = match entry {
      // There are no outdated entries.
      None => 0,
      Some(entry) => {
        let query = doc! { "feed": feed, "_id": { "$lte": entry.id.unwrap() } };
        let res = <Entry as ModelExt>::delete_many(query).await?;
        let count = res.deleted_count;
        count
      }
    };

    info!("Removed {} outdated entries from feed {}", removed, feed);
    // If items were removed, it means new entries were added. We don't care if
    // entries were updated.
    let was_synced = removed > 0;
    Ok(was_synced)
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
