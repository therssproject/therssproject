use bson::serde_helpers::bson_datetime_as_rfc3339_string;
use bson::serde_helpers::serialize_object_id_as_hex_string;
use feed_rs;
use serde::{Deserialize, Serialize};
use std::time::Instant;
use tracing::error;
use tracing::info;
use validator::Validate;
use wither::bson::{doc, oid::ObjectId};
use wither::Model as WitherModel;

use crate::errors::Error;
use crate::errors::NotFound;
use crate::lib::database_model::ModelExt;
use crate::lib::date::{now, Date};
use crate::lib::get_feed::get_feed;
use crate::models::entry::Entry;
use crate::models::subscription::Subscription;

impl ModelExt for Feed {
  type T = Feed;
}

#[derive(Debug, Clone, Serialize, Deserialize, WitherModel, Validate)]
#[model(index(keys = r#"doc!{ "url": 1 }"#, options = r#"doc!{ "unique": true }"#))]
#[model(index(keys = r#"doc!{ "synced_at": 1 }"#))]
pub struct Feed {
  #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
  pub id: Option<ObjectId>,
  pub public_id: String,
  pub feed_type: FeedType,
  pub url: String,
  pub title: Option<String>,
  pub description: Option<String>,
  pub synced_at: Date,
  pub updated_at: Date,
  pub created_at: Date,
}

impl Feed {
  pub async fn from_url(url: String) -> Self {
    // TODO: Remove this unwrap. This is important.
    let raw_feed = get_feed(url.clone()).await.unwrap();

    let title = raw_feed.title.clone().map(|title| title.content);
    let description = raw_feed
      .description
      .clone()
      .map(|description| description.content);
    let now = now();

    Self {
      id: None,
      public_id: raw_feed.id,
      feed_type: FeedType::from(raw_feed.feed_type),
      url,
      title,
      description,
      updated_at: now,
      created_at: now,
      synced_at: now,
    }
  }

  /// Fetch the last RSS Feed version and store it's entries in the database.
  /// If the feed has new entries, update the related subscriptions.
  pub async fn sync(id: ObjectId) -> Result<(), Error> {
    info!("Syncing feed {}", &id);
    let start = Instant::now();

    let feed = Self::find_by_id(&id).await?;
    let feed = match feed {
      Some(feed) => feed,
      None => {
        error!("Failed to sync, Feed with ID {} not found", &id);
        return Err(Error::NotFound(NotFound::new("feed")));
      }
    };

    let url = feed.url;
    let raw_feed = get_feed(url.clone()).await;
    let raw_feed = match raw_feed {
      Ok(raw_feed) => raw_feed,
      Err(err) => {
        error!("Failed to get Feed {}. Error: {}", &id, err);
        // TODO: Return a proper error type. This is not a not found error.
        return Err(Error::NotFound(NotFound::new("feed")));
      }
    };

    let entries = raw_feed
      .entries
      .into_iter()
      // Feed entries are sorted from most recent to least recent. We handle
      // entries sorted chronologically (From oldest to newest).
      .rev()
      .map(|raw_entry| Entry::from_raw_entry(id, raw_entry))
      .collect::<Vec<Entry>>();

    let was_inserted = Entry::sync(&id, entries).await?;
    let synced_at = now();
    let mut update = doc! { "synced_at": &synced_at };

    Self::update_one(doc! { "_id": &id }, doc! { "$set": &update }, None).await?;

    // Update subscriptions. If the feed has new entries, set the scheduled_at
    // attribute so the subscription scheduler picks up this subscription to
    // notify the user with the new entries.
    if was_inserted {
      update.insert("scheduled_at", synced_at);
    }
    Subscription::update_many(doc! { "feed": &id }, doc! { "$set": update}, None).await?;

    let duration = start.elapsed();
    info!("Finished syncing feed {} elapsed={:.0?}", &id, duration);

    Ok(())
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
      id: feed.id.unwrap(),
      public_id: feed.public_id,
      feed_type: feed.feed_type,
      url: feed.url,
      title: feed.title,
      updated_at: feed.updated_at,
      created_at: feed.created_at,
    }
  }
}
