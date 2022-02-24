use bson::serde_helpers::bson_datetime_as_rfc3339_string;
use bson::serde_helpers::serialize_object_id_as_hex_string;
use serde::{Deserialize, Serialize};
use validator::Validate;
use wither::bson::{doc, oid::ObjectId};
use wither::Model as WitherModel;

use crate::database::Database;
use crate::lib::date;
use crate::lib::date::Date;
use crate::lib::fetch_rss;
use crate::models::ModelExt;

#[derive(Clone)]
pub struct Model {
  pub db: Database,
}

impl Model {
  pub fn new(db: Database) -> Self {
    Self { db }
  }

  pub async fn sync(&self, _feed_id: ObjectId) {
    dbg!("Syncing subscription!");
  }
}

impl ModelExt for Model {
  type T = Subscription;
  fn get_database(&self) -> &Database {
    &self.db
  }
}

#[derive(Debug, Clone, Serialize, Deserialize, WitherModel, Validate)]
#[model(index(
  keys = r#"doc!{ "user": 1, "url": 1 }"#,
  options = r#"doc!{ "unique": true }"#
))]
#[model(index(
  keys = r#"doc!{ "user": 1, "feed": 1 }"#,
  options = r#"doc!{ "unique": true }"#
))]
#[model(index(keys = r#"doc!{ "feed": 1 }"#))]
pub struct Subscription {
  #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
  pub id: Option<ObjectId>,
  pub user: ObjectId,
  pub url: String,
  pub feed: ObjectId,
  pub webhook: ObjectId,
  pub checked_at: Date,
  pub updated_at: Date,
  pub created_at: Date,
}

impl Subscription {
  pub fn new(user: ObjectId, feed: ObjectId, webhook: ObjectId, url: String) -> Self {
    let now = date::now();
    Self {
      id: None,
      user,
      url,
      feed,
      webhook,
      checked_at: now,
      updated_at: now,
      created_at: now,
    }
  }

  pub async fn _sync(&self) {
    // TODO: get the URL from the feed instead
    let url = self.url.clone();
    let feed = fetch_rss::fetch_rss(url).await;
    println!("Feed {:#?}", feed);

    // Magic will happen here
  }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PublicSubscription {
  #[serde(alias = "_id", serialize_with = "serialize_object_id_as_hex_string")]
  pub id: ObjectId,
  #[serde(serialize_with = "serialize_object_id_as_hex_string")]
  pub user: ObjectId,
  pub url: String,
  #[serde(serialize_with = "serialize_object_id_as_hex_string")]
  pub feed: ObjectId,
  #[serde(serialize_with = "serialize_object_id_as_hex_string")]
  pub webhook: ObjectId,
  #[serde(with = "bson_datetime_as_rfc3339_string")]
  pub checked_at: Date,
  #[serde(with = "bson_datetime_as_rfc3339_string")]
  pub updated_at: Date,
  #[serde(with = "bson_datetime_as_rfc3339_string")]
  pub created_at: Date,
}

impl From<Subscription> for PublicSubscription {
  fn from(subscription: Subscription) -> Self {
    Self {
      id: subscription
        .id
        .expect("PublicSubscription From<Subscription> expects an id"),
      user: subscription.user,
      url: subscription.url.clone(),
      feed: subscription.feed,
      webhook: subscription.webhook,
      checked_at: subscription.checked_at,
      updated_at: subscription.updated_at,
      created_at: subscription.created_at,
    }
  }
}
