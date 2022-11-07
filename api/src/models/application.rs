use bson::serde_helpers::bson_datetime_as_rfc3339_string;
use bson::serde_helpers::serialize_object_id_as_hex_string;
use futures::StreamExt;
use serde::{Deserialize, Serialize};
use validator::Validate;
use wither::bson::{doc, oid::ObjectId};
use wither::Model as WitherModel;

use crate::errors::Error;
use crate::models::endpoint::Endpoint;
use crate::models::key::Key;
use crate::models::webhook::Webhook;
use crate::utils::database_model::ModelExt;
use crate::utils::date::now;
use crate::utils::date::Date;

use super::subscription::Subscription;

impl ModelExt for Application {
  type T = Application;
}

#[derive(Debug, Clone, Serialize, Deserialize, WitherModel, Validate)]
#[model(index(keys = r#"doc!{ "owner": 1 }"#))]
pub struct Application {
  #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
  pub id: Option<ObjectId>,
  pub owner: ObjectId,
  pub name: String,
  pub description: Option<String>,
  pub updated_at: Date,
  pub created_at: Date,
}

impl Application {
  pub fn new<A, B>(owner: ObjectId, name: A, description: Option<B>) -> Self
  where
    A: Into<String>,
    B: Into<String>,
  {
    let now = now();
    Self {
      id: None,
      owner,
      name: name.into(),
      description: description.map(Into::into),
      updated_at: now,
      created_at: now,
    }
  }

  /// Removes all resourses associated with this application.
  pub async fn reset(id: &ObjectId) -> Result<(), Error> {
    // Remove all webhooks associated with this application.
    <Webhook as ModelExt>::delete_many(doc! { "application": id }).await?;

    // Remove all subscriptions associated with this application.
    let subscriptions = Subscription::cursor(doc! { "application": id }, None).await?;
    subscriptions
      .map(|subscription| subscription.unwrap())
      .for_each_concurrent(25, |subscription| async move {
        // TODO: Handle error.
        subscription.remove().await.unwrap();
      })
      .await;

    // Remove all endpoints associated with this application.
    <Endpoint as ModelExt>::delete_many(doc! { "application": id }).await?;

    // Remove all keys associated with this application.
    <Key as ModelExt>::delete_many(doc! { "application": id }).await?;

    Ok(())
  }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PublicApplication {
  #[serde(alias = "_id", serialize_with = "serialize_object_id_as_hex_string")]
  pub id: ObjectId,
  #[serde(serialize_with = "serialize_object_id_as_hex_string")]
  pub owner: ObjectId,
  pub name: String,
  pub description: Option<String>,
  #[serde(with = "bson_datetime_as_rfc3339_string")]
  pub created_at: Date,
  #[serde(with = "bson_datetime_as_rfc3339_string")]
  pub updated_at: Date,
}

impl From<Application> for PublicApplication {
  fn from(application: Application) -> Self {
    Self {
      id: application.id.unwrap(),
      owner: application.owner,
      name: application.name,
      description: application.description,
      updated_at: application.updated_at,
      created_at: application.created_at,
    }
  }
}
