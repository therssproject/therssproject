mod notify_job;

use bson::serde_helpers::bson_datetime_as_rfc3339_string;
use bson::serde_helpers::serialize_object_id_as_hex_string;
use serde::{Deserialize, Serialize};
use tracing::{debug, error};
use validator::Validate;
use wither::bson::{doc, oid::ObjectId, Bson};
use wither::mongodb::options::FindOptions;
use wither::Model as WitherModel;

use crate::database::Database;
use crate::errors::{Error, NotFound};
use crate::lib::database_model::ModelExt;
use crate::lib::date::{now, Date};
use crate::messenger::Messenger;
use crate::models::entry::Model as EntryModel;
use crate::models::webhook::Model as WebhookModel;

#[derive(Clone)]
pub struct Model {
  pub db: Database,
  pub entry: EntryModel,
  pub webhook: WebhookModel,
}

impl Model {
  pub async fn setup(db: Database, messenger: Messenger) -> Self {
    let entry = EntryModel::new(db.clone());
    let webhook = WebhookModel::new(db.clone());
    let this = Self { db, entry, webhook };

    notify_job::setup(this.clone(), messenger).await.unwrap();
    this
  }

  pub async fn notify(&self, id: ObjectId) -> Result<(), Error> {
    debug!("Notifying subscription!");

    let subscription = self.find_by_id(&id).await?;
    let subscription = match subscription {
      Some(subscription) => subscription,
      None => {
        error!("Failed to notify, Subscription with ID {} not found", &id);
        return Err(Error::NotFound(NotFound::new("subscription")));
      }
    };

    let mut query = doc! { "feed": subscription.feed };
    // Query entries that are newer than the last notified feed entry. If this
    // is the first time we're notifying, we'll query all entries.
    if let Some(last_notified_feed) = subscription.last_notified_feed {
      query.insert("_id", doc! { "$gt": last_notified_feed });
    }

    let entries = self.entry.find(query, sort_by_id()).await?;
    let has_entries = !entries.is_empty();
    if !has_entries {
      debug!("No new entries found for subscription {}", &id);
      return Ok(());
    }

    self
      .webhook
      .notify(subscription.webhook, id, &entries)
      .await
      .unwrap();

    let last_entry = entries.last().unwrap();

    self
      .update_one(
        doc! {
          "_id": &id,
          // We might have concurrent jobs processing the same subscription.
          // Store the last sent notification feed.
          "$or": [
              { "last_notified_feed": Bson::Null },
              { "last_notified_feed": { "$lt": last_entry.id } }
          ]
        },
        doc! {
          "$set": {
            "last_notified_feed": last_entry.id,
            // TODO: Use the webhook notification date?
            "notified_at": now()
          }
        },
        None,
      )
      .await?;

    Ok(())
  }
}

impl ModelExt for Model {
  type T = Subscription;
  fn get_database(&self) -> &Database {
    &self.db
  }
}

#[derive(Debug, Clone, Serialize, Deserialize, WitherModel, Validate)]
#[model(index(
  keys = r#"doc!{ "user": 1, "url": 1 }"#,
  options = r#"doc!{ "unique": true }"#
))]
#[model(index(
  keys = r#"doc!{ "user": 1, "feed": 1 }"#,
  options = r#"doc!{ "unique": true }"#
))]
#[model(index(keys = r#"doc!{ "feed": 1 }"#))]
pub struct Subscription {
  #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
  pub id: Option<ObjectId>,
  pub user: ObjectId,
  pub url: String,
  pub feed: ObjectId,
  pub webhook: ObjectId,

  pub last_notified_feed: Option<ObjectId>,
  pub checked_at: Option<Date>,
  pub notified_at: Option<Date>,

  pub updated_at: Date,
  pub created_at: Date,
}

impl Subscription {
  pub fn new(user: ObjectId, feed: ObjectId, webhook: ObjectId, url: String) -> Self {
    let now = now();
    Self {
      id: None,
      user,
      url,
      feed,
      webhook,
      last_notified_feed: None,
      notified_at: None,
      checked_at: None,
      updated_at: now,
      created_at: now,
    }
  }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PublicSubscription {
  #[serde(alias = "_id", serialize_with = "serialize_object_id_as_hex_string")]
  pub id: ObjectId,
  #[serde(serialize_with = "serialize_object_id_as_hex_string")]
  pub user: ObjectId,
  pub url: String,
  #[serde(serialize_with = "serialize_object_id_as_hex_string")]
  pub feed: ObjectId,
  #[serde(serialize_with = "serialize_object_id_as_hex_string")]
  pub webhook: ObjectId,
  #[serde(with = "bson_datetime_as_rfc3339_string")]
  pub updated_at: Date,
  #[serde(with = "bson_datetime_as_rfc3339_string")]
  pub created_at: Date,
}

impl From<Subscription> for PublicSubscription {
  fn from(subscription: Subscription) -> Self {
    Self {
      id: subscription
        .id
        .expect("PublicSubscription From<Subscription> expects an id"),
      user: subscription.user,
      url: subscription.url.clone(),
      feed: subscription.feed,
      webhook: subscription.webhook,
      updated_at: subscription.updated_at,
      created_at: subscription.created_at,
    }
  }
}

fn sort_by_id() -> FindOptions {
  FindOptions::builder().sort(doc! { "_id": 1 }).build()
}
