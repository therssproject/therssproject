use again::RetryPolicy;
use bson::serde_helpers::bson_datetime_as_rfc3339_string;
use bson::serde_helpers::serialize_object_id_as_hex_string;
use lazy_static::lazy_static;
use serde::{Deserialize, Serialize};
use serde_json::Value as Json;
use std::time::Duration;
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
use crate::models::feed::Feed;
use crate::models::webhook::Status;
use crate::models::webhook::Webhook;
use crate::models::webhook::WebhookSendPayload;

lazy_static! {
  static ref CLIENT: reqwest::Client = reqwest::Client::builder()
    .timeout(Duration::from_secs(5))
    .build()
    .expect("Failed to create a reqwest client");
}

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
  pub fn new<A, B>(application: ObjectId, url: A, title: B) -> Self
  where
    A: Into<String>,
    B: Into<String>,
  {
    let now = now();
    Self {
      id: None,
      application,
      url: url.into(),
      title: title.into(),
      updated_at: now,
      created_at: now,
    }
  }

  // TODO: Update this API, I think is better to send the `WebhookSendPayload`
  // as an argument in this function. The responsability of this function is
  // just to send the webhook.
  pub async fn send_webhook(
    endpoint: ObjectId,
    application: ObjectId,
    subscription: ObjectId,
    feed: ObjectId,
    entries: Vec<Entry>,
    metadata: Option<Json>,
  ) -> Result<Webhook, Error> {
    debug!("Notifying endpoint");

    let endpoint_id = endpoint;
    let endpoint = Self::find_by_id(&endpoint_id).await?;
    let endpoint = match endpoint {
      Some(endpoint) => endpoint,
      None => {
        error!(
          "Failed to notify. Endpoint with ID {} not found",
          &endpoint_id
        );
        return Err(Error::NotFound(NotFound::new("endpoint")));
      }
    };

    let feed_id = feed;
    let feed = Feed::find_by_id(&feed_id).await?;
    let feed = match feed {
      Some(feed) => feed,
      None => {
        error!("Failed to notify. Feed with ID {} not found", &feed_id);
        return Err(Error::NotFound(NotFound::new("feed")));
      }
    };

    let endpoint_url = endpoint.url;
    let public_id = Uuid::new_v4();

    let payload = WebhookSendPayload {
      id: public_id.to_string(),
      application,
      subscription,
      endpoint: endpoint_id,
      entries: entries.into_iter().map(Into::into).collect(),
      metadata,
    };

    let sent_at = now();
    let policy = RetryPolicy::exponential(Duration::from_millis(200))
      .with_max_retries(3)
      .with_max_delay(Duration::from_secs(1));

    let res = policy
      .retry(|| CLIENT.post(&endpoint_url).json(&payload).send())
      .await;

    let status = match res {
      Err(_) => Status::Failed,
      Ok(res) => match res.error_for_status() {
        Ok(_) => Status::Sent,
        Err(_) => Status::Failed,
      },
    };

    let webhook = Webhook {
      id: None,
      status,
      application,
      subscription,
      feed: feed_id,
      endpoint: endpoint_id,
      endpoint_url,
      feed_url: feed.url,
      feed_title: feed.title,
      created_at: sent_at,
    };

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
