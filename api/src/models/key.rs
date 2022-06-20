use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;
use wither::bson::{doc, oid::ObjectId};
use wither::Model as WitherModel;

use crate::lib::database_model::ModelExt;
use crate::lib::date::{now, Date};

impl ModelExt for Key {
  type T = Key;
}

#[derive(Debug, Clone, Serialize, Deserialize, WitherModel, Validate)]
#[model(index(keys = r#"doc!{ "application": 1 }"#))]
#[model(index(keys = r#"doc!{ "key": 1 }"#))]
pub struct Key {
  #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
  pub id: Option<ObjectId>,
  pub application: ObjectId,
  pub key: String,
  pub title: String,
  pub created_at: Date,
}

impl Key {
  // TODO: Remove allow dead code when this fn is used.
  #[allow(dead_code)]
  pub fn new<T: Into<String>>(application: ObjectId, title: T) -> Self {
    let now = now();
    Self {
      id: None,
      application,
      // TODO: Store a hashed version of the key.
      key: Uuid::new_v4().to_string(),
      title: title.into(),
      created_at: now,
    }
  }
}
