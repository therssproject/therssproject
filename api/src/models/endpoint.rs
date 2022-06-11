use bson::serde_helpers::bson_datetime_as_rfc3339_string;
use bson::serde_helpers::serialize_object_id_as_hex_string;
use serde::{Deserialize, Serialize};
use serde_json::Value as Json;
use tracing::{debug, error};
use uuid::Uuid;
use validator::Validate;
use wither::bson::{doc, oid::ObjectId};
use wither::Model as WitherModel;

use crate::errors::Error;
use crate::errors::NotFound;
use crate::lib::database_model::ModelExt;
use crate::lib::date::{now, Date};
use crate::models::entry::Entry;
use crate::models::webhook::Webhook;
use crate::models::webhook::WebhookSendPayload;

impl ModelExt for Endpoint {
  type T = Endpoint;
}

#[derive(Debug, Clone, Serialize, Deserialize, WitherModel, Validate)]
#[model(index(
  keys = r#"doc!{ "application": 1, "url": 1 }"#,
  options = r#"doc!{ "unique": true }"#
))]
pub struct Endpoint {
  #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
  pub id: Option<ObjectId>,
  pub application: ObjectId,
  pub url: String,
  pub title: String,
  pub updated_at: Date,
  pub created_at: Date,
}

impl Endpoint {
  pub fn new(application: ObjectId, url: String, title: String) -> Self {
    let now = now();
    Self {
      id: None,
      application,
      url,
      title,
      updated_at: now,
      created_at: now,
    }
  }

  // TODO: Update this API, I think is better to send the `WebhookSendPayload`
  // as an argument in this function. The responsability of this function is
  // just to send the webhook.
  pub async fn send_webhook(
    id: ObjectId,
    application: ObjectId,
    subscription: ObjectId,
    entries: Vec<Entry>,
    metadata: Option<Json>,
  ) -> Result<Webhook, Error> {
    debug!("Notifying endpoint");

    let endpoint = Self::find_by_id(&id).await?;
    let endpoint = match endpoint {
      Some(endpoint) => endpoint,
      None => {
        error!("Failed to notify. Endpoint with ID {} not found", &id);
        return Err(Error::NotFound(NotFound::new("endpoint")));
      }
    };

    let client = reqwest::Client::new();
    let url = endpoint.url;
    let public_id = Uuid::new_v4();

    let payload = WebhookSendPayload {
      // TODO: Update this ID. I think this should be our internal ID to better
      // identify and debug webhooks.
      id: public_id.to_string(),
      application,
      subscription,
      endpoint: id,
      entries: entries.into_iter().map(Into::into).collect(),
      metadata,
    };

    let sent_at = now();
    // TODO: Store the request response status.
    let _res = client.post(&url).json(&payload).send().await.unwrap();

    let webhook = Webhook::new(endpoint.application, subscription, id, url.clone(), sent_at);
    let webhook = Webhook::create(webhook).await?;

    Ok(webhook)
  }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PublicEndpoint {
  #[serde(alias = "_id", serialize_with = "serialize_object_id_as_hex_string")]
  pub id: ObjectId,
  #[serde(serialize_with = "serialize_object_id_as_hex_string")]
  pub application: ObjectId,
  pub url: String,
  pub title: String,
  #[serde(with = "bson_datetime_as_rfc3339_string")]
  pub updated_at: Date,
  #[serde(with = "bson_datetime_as_rfc3339_string")]
  pub created_at: Date,
}

impl From<Endpoint> for PublicEndpoint {
  fn from(endpoint: Endpoint) -> Self {
    Self {
      id: endpoint.id.unwrap(),
      application: endpoint.application,
      url: endpoint.url,
      title: endpoint.title,
      updated_at: endpoint.updated_at,
      created_at: endpoint.created_at,
    }
  }
}
