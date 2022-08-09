use bson::serde_helpers::bson_datetime_as_rfc3339_string;
use bson::serde_helpers::serialize_object_id_as_hex_string;
use serde::{Deserialize, Serialize};
use validator::Validate;
use wither::bson::{doc, oid::ObjectId};
use wither::Model as WitherModel;

use crate::lib::create_random_string::create_random_string;
use crate::lib::database_model::ModelExt;
use crate::lib::date::{now, Date};
use crate::lib::hash::sha256;
use crate::lib::serde::bson_datetime_option_as_rfc3339_string;

impl ModelExt for Key {
  type T = Key;
}

#[derive(Debug, Clone, Serialize, Deserialize, WitherModel, Validate)]
#[model(index(keys = r#"doc!{ "application": 1 }"#))]
#[model(index(keys = r#"doc!{ "key": 1 }"#, options = r#"doc!{ "unique": true }"#))]
pub struct Key {
  #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
  pub id: Option<ObjectId>,
  pub application: ObjectId,
  pub key: String,
  pub title: String,
  // TODO: Implement this.
  pub used_at: Option<Date>,
  pub created_at: Date,
  pub created_by: ObjectId,
}

impl Key {
  pub fn new<T: Into<String>>(
    application: &ObjectId,
    title: T,
    created_by: &ObjectId,
  ) -> (Self, String) {
    let now = now();
    let key = create_random_string(40);
    let hash = sha256(&key);

    let this = Self {
      id: None,
      application: *application,
      key: hash,
      title: title.into(),
      used_at: None,
      created_at: now,
      created_by: *created_by,
    };

    (this, key)
  }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PublicKey {
  #[serde(alias = "_id", serialize_with = "serialize_object_id_as_hex_string")]
  pub id: ObjectId,
  #[serde(serialize_with = "serialize_object_id_as_hex_string")]
  pub application: ObjectId,
  pub title: String,
  #[serde(serialize_with = "bson_datetime_option_as_rfc3339_string")]
  pub used_at: Option<Date>,
  #[serde(with = "bson_datetime_as_rfc3339_string")]
  pub created_at: Date,
  #[serde(serialize_with = "serialize_object_id_as_hex_string")]
  pub created_by: ObjectId,
}

impl From<Key> for PublicKey {
  fn from(key: Key) -> Self {
    Self {
      id: key.id.unwrap(),
      application: key.application,
      title: key.title,
      used_at: key.used_at,
      created_at: key.created_at,
      created_by: key.created_by,
    }
  }
}
