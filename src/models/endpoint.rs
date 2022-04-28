use bson::serde_helpers::bson_datetime_as_rfc3339_string;
use bson::serde_helpers::serialize_object_id_as_hex_string;
use serde::{Deserialize, Serialize};
use tracing::{debug, error};
use validator::Validate;
use wither::bson::{doc, oid::ObjectId};
use wither::Model as WitherModel;

use crate::database::Database;
use crate::errors::Error;
use crate::errors::NotFound;
use crate::lib::database_model::ModelExt;
use crate::lib::date::{now, Date};
use crate::models::entry::Entry;
use crate::models::webhook::Model as WebhookModel;
use crate::models::webhook::Webhook;

#[derive(Clone)]
pub struct Model {
  pub db: Database,
  pub webhook: WebhookModel,
}

impl Model {
  pub fn new(db: Database) -> Self {
    let webhook = WebhookModel::new(db.clone());
    Self { db, webhook }
  }

  pub async fn send_webhook(
    &self,
    id: ObjectId,
    subscription: ObjectId,
    _entries: &[Entry],
  ) -> Result<(), Error> {
    debug!("Notifying endpoint");

    let endpoint = self.find_by_id(&id).await?;
    let endpoint = match endpoint {
      Some(endpoint) => endpoint,
      None => {
        error!("Failed to notify, Endpoint with ID {} not found", &id);
        return Err(Error::NotFound(NotFound::new("endpoint")));
      }
    };

    let webhook = Webhook::new(endpoint.application, subscription, id, endpoint.url.clone());

    let client = reqwest::Client::new();
    let url = endpoint.url;
    let _res = client.post(url).json(&webhook).send().await.unwrap();
    self.webhook.create(webhook).await?;

    Ok(())
  }
}

impl ModelExt for Model {
  type T = Endpoint;
  fn get_database(&self) -> &Database {
    &self.db
  }
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
