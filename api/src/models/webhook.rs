use bson::serde_helpers::bson_datetime_as_rfc3339_string;
use bson::serde_helpers::serialize_object_id_as_hex_string;
use serde::{Deserialize, Serialize};
use serde_json::Value as Json;
use validator::Validate;
use wither::bson::{doc, oid::ObjectId};
use wither::Model as WitherModel;

use crate::lib::database_model::ModelExt;
use crate::lib::date::Date;
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
#[model(index(keys = r#"doc!{ "application": 1, "sent_at": 1 }"#))]
#[model(index(keys = r#"doc!{ "application": 1, "subscription": 1, "sent_at": 1 }"#))]
pub struct Webhook {
  #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
  pub id: Option<ObjectId>,
  pub application: ObjectId,
  pub subscription: ObjectId,
  pub feed: ObjectId,
  pub endpoint: ObjectId,
  pub status: Status,
  // These are denormalized values. We want to keep a record of the original
  // endpoint and feed URL, as well as the feed title. This is also useful for
  // performance reasons.
  pub endpoint_url: String,
  pub feed_url: String,
  pub feed_title: Option<String>,
  pub sent_at: Date,
  pub created_at: Date,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Status {
  Sent,
  Failed,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PublicWebhook {
  #[serde(alias = "_id", serialize_with = "serialize_object_id_as_hex_string")]
  pub id: ObjectId,
  #[serde(serialize_with = "serialize_object_id_as_hex_string")]
  pub application: ObjectId,
  #[serde(serialize_with = "serialize_object_id_as_hex_string")]
  pub subscription: ObjectId,
  #[serde(serialize_with = "serialize_object_id_as_hex_string")]
  pub feed: ObjectId,
  #[serde(serialize_with = "serialize_object_id_as_hex_string")]
  pub endpoint: ObjectId,
  pub status: Status,
  pub endpoint_url: String,
  pub feed_url: String,
  pub feed_title: Option<String>,
  #[serde(with = "bson_datetime_as_rfc3339_string")]
  pub created_at: Date,
  #[serde(with = "bson_datetime_as_rfc3339_string")]
  pub sent_at: Date,
}

impl From<Webhook> for PublicWebhook {
  fn from(webhook: Webhook) -> Self {
    Self {
      id: webhook.id.unwrap(),
      application: webhook.application,
      subscription: webhook.subscription,
      feed: webhook.feed,
      endpoint: webhook.endpoint,
      status: webhook.status,
      endpoint_url: webhook.endpoint_url,
      feed_url: webhook.feed_url,
      feed_title: webhook.feed_title,
      created_at: webhook.created_at,
      sent_at: webhook.sent_at,
    }
  }
}

// Webhook payload sent to the user's endpoint.
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
  pub metadata: Option<Json>,
}
