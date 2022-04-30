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
use crate::models::endpoint::Model as EndpointModel;
use crate::models::entry::Model as EntryModel;

#[derive(Clone)]
pub struct Model {
  pub db: Database,
  pub entry: EntryModel,
  pub endpoint: EndpointModel,
}

impl Model {
  pub async fn setup(db: Database, messenger: Messenger) -> Self {
    let entry = EntryModel::new(db.clone());
    let endpoint = EndpointModel::new(db.clone());
    let this = Self {
      db,
      entry,
      endpoint,
    };

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

    let mut get_entries_query = doc! { "feed": subscription.feed };
    // Query entries that are newer than the last notified feed entry. If this
    // is the first time we're notifying, we'll query all entries.
    if let Some(last_notified_entry) = subscription.last_notified_entry {
      get_entries_query.insert("_id", doc! { "$gt": last_notified_entry });
    }

    let entries = self.entry.find(get_entries_query, sort_by_id()).await?;
    let has_entries = !entries.is_empty();
    if !has_entries {
      debug!("No new entries found for subscription {}", &id);
      return Ok(());
    }

    let result = self
      .endpoint
      .send_webhook(
        subscription.endpoint,
        subscription.application,
        id,
        entries.clone(),
      )
      .await;

    if let Err(err) = result {
      debug!("Failed to send webhook to subscription {}", &id);
      return Err(err);
    }

    let last_entry = entries.last().unwrap();

    self
      .update_one(
        doc! {
          "_id": &id,
          // We might have concurrent jobs processing the same subscription.
          // Make sure the update is applied only if the last notified entry is
          // newer than the last entry on the database.
          "$or": [
              { "last_notified_entry": Bson::Null },
              { "last_notified_entry": { "$lt": last_entry.id } }
          ]
        },
        doc! {
          "$set": {
            "last_notified_entry": last_entry.id,
            // TODO: Use the webhook notification date
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
#[model(index(keys = r#"doc!{ "application": 1 }"#))]
#[model(index(keys = r#"doc!{ "feed": 1 }"#))]
pub struct Subscription {
  #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
  pub id: Option<ObjectId>,
  pub application: ObjectId,
  pub url: String,
  pub feed: ObjectId,
  pub endpoint: ObjectId,

  // Last time the subscription was notified and the last feed entry sent. The
  // last entry is required to calculate what entries needs to be sent next.
  pub last_notified_entry: Option<ObjectId>,
  pub last_notified_at: Option<Date>,

  pub created_at: Date,
}

impl Subscription {
  pub fn new(application: ObjectId, feed: ObjectId, endpoint: ObjectId, url: String) -> Self {
    let now = now();
    Self {
      id: None,
      application,
      url,
      feed,
      endpoint,
      last_notified_entry: None,
      last_notified_at: None,
      created_at: now,
    }
  }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PublicSubscription {
  #[serde(alias = "_id", serialize_with = "serialize_object_id_as_hex_string")]
  pub id: ObjectId,
  #[serde(serialize_with = "serialize_object_id_as_hex_string")]
  pub application: ObjectId,
  pub url: String,
  #[serde(serialize_with = "serialize_object_id_as_hex_string")]
  pub feed: ObjectId,
  #[serde(serialize_with = "serialize_object_id_as_hex_string")]
  pub endpoint: ObjectId,
  #[serde(with = "bson_datetime_as_rfc3339_string")]
  pub created_at: Date,
}

impl From<Subscription> for PublicSubscription {
  fn from(subscription: Subscription) -> Self {
    Self {
      id: subscription.id.unwrap(),
      application: subscription.application,
      url: subscription.url.clone(),
      feed: subscription.feed,
      endpoint: subscription.endpoint,
      created_at: subscription.created_at,
    }
  }
}

fn sort_by_id() -> FindOptions {
  FindOptions::builder().sort(doc! { "_id": 1 }).build()
}
