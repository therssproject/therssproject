use feed_rs::model::Entry as RawEntry;
use futures::{stream, StreamExt};
use lazy_static::lazy_static;
use serde::{Deserialize, Serialize};
use tracing::{error, info};
use validator::Validate;
use wither::bson::{doc, oid::ObjectId};
use wither::mongodb::options::FindOneOptions;
use wither::Model as WitherModel;
use wither::WitherError;

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
        let res = <Entry as ModelExt>::create(entry).await;
        if let Err(err) = res {
          let is_duplicate = is_duplicate_error(&err);
          if !is_duplicate {
            error!(
              "Error inserting entry with public ID {} to feed {}. Error: {}",
              public_id, &feed, err
            );
          }
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
        res.deleted_count
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

// TODO: Extend wither error to do this.
fn is_duplicate_error(error: &Error) -> bool {
  use wither::mongodb::error::CommandError;
  use wither::mongodb::error::ErrorKind;

  // Is wither error.
  let error = match error {
    Error::Wither(error) => error,
    _ => return false,
  };

  // Is Mongo error.
  let error = match error {
    WitherError::Mongo(error) => error,
    _ => return false,
  };

  // TODO: Not sure how to pattern match a Box.
  let kind = *error.kind.clone();

  // Is duplicate
  matches!(kind, ErrorKind::Command(CommandError { code: 11000, .. }))
}
