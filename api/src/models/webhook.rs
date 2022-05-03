use bson::serde_helpers::bson_datetime_as_rfc3339_string;
use bson::serde_helpers::serialize_object_id_as_hex_string;
use serde::{Deserialize, Serialize};
use validator::Validate;
use wither::bson::{doc, oid::ObjectId};
use wither::Model as WitherModel;

use crate::lib::database_model::ModelExt;
use crate::lib::date::{now, Date};
use crate::models::entry::PublicEntry;

// This model represents a request sent to the user's endpoint and its response
// status. The webhook representation stored on the database is a reduced
// version of the actual payload sent to the user. We send all new entries for a
// specific feed and we are not interested in storing that.

impl ModelExt for Webhook {
  type T = Webhook;
}

// TODO: Add response status to the webhook model.
#[derive(Debug, Clone, Serialize, Deserialize, WitherModel, Validate)]
#[model(index(keys = r#"doc!{ "application": 1, "subscription": 1 }"#))]
pub struct Webhook {
  #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
  pub id: Option<ObjectId>,
  pub application: ObjectId,
  pub subscription: ObjectId,
  pub webhook: ObjectId,
  // The webhook might change its URL, we want to keep a record of the original
  // URL where this webhook was sent.
  pub url: String,
  pub sent_at: Date,
  pub created_at: Date,
}

impl Webhook {
  pub fn new(
    application: ObjectId,
    subscription: ObjectId,
    webhook: ObjectId,
    url: String,
    sent_at: Date,
  ) -> Self {
    Self {
      id: None,
      application,
      subscription,
      webhook,
      url,
      sent_at,
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

// This is the actual data sent to the user's endpoint.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebhookSendPayload {
  pub id: String,
  #[serde(alias = "_id", serialize_with = "serialize_object_id_as_hex_string")]
  pub application: ObjectId,
  #[serde(alias = "_id", serialize_with = "serialize_object_id_as_hex_string")]
  pub subscription: ObjectId,
  #[serde(alias = "_id", serialize_with = "serialize_object_id_as_hex_string")]
  pub endpoint: ObjectId,
  pub entries: Vec<PublicEntry>,
}
