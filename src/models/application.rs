use bson::serde_helpers::bson_datetime_as_rfc3339_string;
use bson::serde_helpers::serialize_object_id_as_hex_string;
use serde::{Deserialize, Serialize};
use validator::Validate;
use wither::bson::{doc, oid::ObjectId};
use wither::Model as WitherModel;

use crate::database::Database;
use crate::lib::database_model::ModelExt;
use crate::lib::date::now;
use crate::lib::date::Date;

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
  type T = Application;
  fn get_database(&self) -> &Database {
    &self.db
  }
}

#[derive(Debug, Clone, Serialize, Deserialize, WitherModel, Validate)]
#[model(index(keys = r#"doc!{ "user": 1 }"#))]
pub struct Application {
  #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
  pub id: Option<ObjectId>,
  pub user: ObjectId,
  pub name: String,
  pub description: Option<String>,
  pub updated_at: Date,
  pub created_at: Date,
}

impl Application {
  pub fn new(user: ObjectId, name: String, description: Option<String>) -> Self {
    let now = now();
    Self {
      id: None,
      user,
      name,
      description,
      updated_at: now,
      created_at: now,
    }
  }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PublicApplication {
  #[serde(alias = "_id", serialize_with = "serialize_object_id_as_hex_string")]
  pub id: ObjectId,
  #[serde(serialize_with = "serialize_object_id_as_hex_string")]
  pub user: ObjectId,
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
      user: application.user,
      name: application.name,
      description: application.description,
      updated_at: application.updated_at,
      created_at: application.created_at,
    }
  }
}
