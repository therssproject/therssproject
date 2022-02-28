use bson::serde_helpers::bson_datetime_as_rfc3339_string;
use bson::serde_helpers::serialize_object_id_as_hex_string;
use serde::{Deserialize, Serialize};
use validator::Validate;
use wither::bson::{doc, oid::ObjectId};
use wither::Model as WitherModel;
use tracing::{debug, error};
use std::collections::HashMap;

use crate::database::Database;
use crate::lib::date::Date;
use crate::models::ModelExt;
use crate::errors::Error;
use crate::errors::NotFound;
use crate::models::entry::Entry;

#[derive(Clone)]
pub struct Model {
  pub db: Database,
}

impl Model {
  pub fn new(db: Database) -> Self {
    Self { db }
  }

  // TODO:
  // * Create webhook payload struct
  // * Store a database record with the failed or successful webhook
  // * Return the webhook notification date so we can store it in the
  //   subscription.
  pub async fn notify(&self, id: ObjectId, entries: &Vec<Entry>) -> Result<(), Error> {
    debug!("notifying webhook");

    let webhook = self.find_by_id(&id).await?;
    let webhook = match webhook {
      Some(webhook) => webhook,
      None => {
        error!("Failed to notify, Webhook with ID {} not found", &id);
        return Err(Error::NotFound(NotFound::new("webhook")));
      }
    };

    let mut map = HashMap::new();
    map.insert("foo", "baz");
    map.insert("entries", "baz");

    let client = reqwest::Client::new();
    let url = webhook.url;
    let _res = client.post(url)
        .json(&map)
        .send()
        .await
        .unwrap();

    Ok(())
  }
}

impl ModelExt for Model {
  type T = Webhook;
  fn get_database(&self) -> &Database {
    &self.db
  }
}

#[derive(Debug, Clone, Serialize, Deserialize, WitherModel, Validate)]
#[model(index(
  keys = r#"doc!{ "user": 1, "url": 1 }"#,
  options = r#"doc!{ "unique": true }"#
))]
pub struct Webhook {
  #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
  pub id: Option<ObjectId>,
  pub user: ObjectId,
  pub url: String,
  pub title: Option<String>,
  pub updated_at: Date,
  pub created_at: Date,
}

impl Webhook {
  pub fn new(user: ObjectId, url: String, title: Option<String>) -> Self {
    let now = Date::now();
    Self {
      id: None,
      user,
      url,
      title,
      updated_at: now,
      created_at: now,
    }
  }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PublicWebhook {
  #[serde(alias = "_id", serialize_with = "serialize_object_id_as_hex_string")]
  pub id: ObjectId,
  #[serde(serialize_with = "serialize_object_id_as_hex_string")]
  pub user: ObjectId,
  pub url: String,
  pub title: Option<String>,
  #[serde(with = "bson_datetime_as_rfc3339_string")]
  pub updated_at: Date,
  #[serde(with = "bson_datetime_as_rfc3339_string")]
  pub created_at: Date,
}

impl From<Webhook> for PublicWebhook {
  fn from(webhook: Webhook) -> Self {
    Self {
      id: webhook
        .id
        .expect("PublicWebhook From<Webhook> expects an id"),
      user: webhook.user,
      url: webhook.url,
      title: webhook.title,
      updated_at: webhook.updated_at,
      created_at: webhook.created_at,
    }
  }
}
