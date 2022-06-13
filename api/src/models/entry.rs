use feed_rs::model::Entry as RawEntry;
use futures::{stream, StreamExt};
use lazy_static::lazy_static;
use serde::{Deserialize, Serialize};
use tracing::{debug, error, info};
use validator::Validate;
use wither::bson::{doc, oid::ObjectId};
use wither::mongodb::options::FindOneOptions;
use wither::Model as WitherModel;

use crate::errors::Error;
use crate::lib::database_model::ModelExt;
use crate::lib::date::now;
use crate::lib::date::Date;
use crate::lib::serde::bson_datetime_option_as_rfc3339_string;

type Entries = Vec<Entry>;

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

  /// This function tries to insert as many entries as possible. When a write
  /// fails, continue with the remaining writes, if any. Order is extremely
  /// important, entries should be sorted chronologically (From oldest to
  /// newest). The biggest MongoDB ID will end up being the most recent feed
  /// entry.
  pub async fn insert(feed: &ObjectId, entries: Vec<Entry>) -> Result<bool, Error> {
    if entries.is_empty() {
      return Ok(false);
    }

    // If the most recent item from the feed is already in the database, the
    // feed is already synced.
    let most_recent_entry = entries[entries.len() - 1].clone();
    let is_synced = Self::exists(doc! {
      "feed": feed,
      "public_id": most_recent_entry.public_id
    })
    .await?;
    if is_synced {
      debug!("Feed {} is already in sync", &feed);
      return Ok(false);
    }

    insert_updated_entries(feed, entries.clone()).await?;
    remove_outdated_entries(feed, entries.clone()).await?;

    Ok(true)
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

async fn insert_updated_entries(feed: &ObjectId, entries: Entries) -> Result<(), Error> {
  let most_recent =
    <Entry as ModelExt>::find_one(doc! { "feed": &feed }, Some(SORT_DESC.clone())).await?;

  let entries = match most_recent {
    None => entries,
    Some(most_recent) => {
      // Find the most recent entry from the database in the feed entries.
      let index = entries
        .iter()
        .position(|entry| entry.public_id == most_recent.public_id);

      match index {
        // If the most recent entry from the database is not on the feed entries
        // insert all entries. This can happen if the feed has updated all its
        // entries since our last sync.
        None => entries,
        // If the most recent entry from the database is on the feed entries
        // filter and get only the entries that are newer than this entry.
        Some(index) => entries.into_iter().skip(index + 1).collect(),
      }
    }
  };

  info!("Inserting {} new entries to feed {}", entries.len(), feed);
  stream::iter(entries)
    // This is done sequential because we depend on the insertion order. We do
    // not use the insert_many function because it does not allow to insert docs
    // in order and skip duplicates. This can be improved in the future using a
    // bulk insert.
    .for_each(|entry| async move {
      let public_id = entry.public_id.clone();
      let res = <Entry as ModelExt>::create(entry).await;
      if let Err(err) = res {
        // This usually happens when the feed updates its entries order and
        // promotes an old entry to the top (Maybe because the entry was
        // updated). We then try to insert it, but it is already created on our
        // database. We skip this entry but ideally we should notify the user
        // somehow that his happened
        error!(
          "Error inserting entry with public ID {} to feed {}. Error: {}",
          public_id, &feed, err
        );
      }
    })
    .await;

  Ok(())
}

/// Cleanup outdated entries that are not present in the feed anymore. Ideally
/// the database state should be the same as the feed's.
async fn remove_outdated_entries(feed: &ObjectId, entries: Entries) -> Result<(), Error> {
  let oldest = entries[0].clone();

  let entry =
    <Entry as ModelExt>::find_one(doc! { "feed": feed, "public_id": oldest.public_id }, None)
      .await?
      .expect("Oldest entry not found when removing outdated entries");

  let res =
    <Entry as ModelExt>::delete_many(doc! { "feed": feed, "_id": { "$lt": entry.id.unwrap() } })
      .await?;
  let count = res.deleted_count;
  info!("Removed {} entries from feed {}", count, feed);

  Ok(())
}
