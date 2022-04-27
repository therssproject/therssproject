use bson::serde_helpers::bson_datetime_as_rfc3339_string;
use bson::serde_helpers::serialize_object_id_as_hex_string;
use serde::{Deserialize, Serialize};
use validator::Validate;
use wither::bson::{doc, oid::ObjectId};
use wither::Model as WitherModel;

use crate::database::Database;
use crate::lib::database_model::ModelExt;
use crate::lib::date::{now, Date};

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
  type T = Webhook;
  fn get_database(&self) -> &Database {
    &self.db
  }
}

#[derive(Debug, Clone, Serialize, Deserialize, WitherModel, Validate)]
#[model(index(
  keys = r#"doc!{ "application": 1, "url": 1 }"#,
  options = r#"doc!{ "unique": true }"#
))]
pub struct Webhook {
  #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
  pub id: Option<ObjectId>,
  pub application: ObjectId,
  pub subscription: ObjectId,
  pub webhook: ObjectId,
  // The webhook might change its URL, we want to keep a record of the original
  // URL where this is webhook was sent.
  pub url: String,
  pub created_at: Date,
}

impl Webhook {
  pub fn new(
    application: ObjectId,
    subscription: ObjectId,
    webhook: ObjectId,
    url: String,
  ) -> Self {
    Self {
      id: None,
      application,
      subscription,
      webhook,
      url,
      created_at: now(),
    }
  }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PublicWebhook {
  #[serde(alias = "_id", serialize_with = "serialize_object_id_as_hex_string")]
  pub id: ObjectId,
  #[serde(serialize_with = "serialize_object_id_as_hex_string")]
  pub application: ObjectId,
  #[serde(serialize_with = "serialize_object_id_as_hex_string")]
  pub webhook: ObjectId,
  pub url: String,
  #[serde(with = "bson_datetime_as_rfc3339_string")]
  pub created_at: Date,
}

impl From<Webhook> for PublicWebhook {
  fn from(webhook: Webhook) -> Self {
    Self {
      id: webhook.id.unwrap(),
      application: webhook.application,
      webhook: webhook.webhook,
      url: webhook.url,
      created_at: webhook.created_at,
    }
  }
}
