use axum::{
  extract::{Extension, Path},
  routing::{delete, get, post},
  Json, Router,
};
use bson::doc;
use serde::Deserialize;
use serde_json::Value as JsonValue;
use std::collections::HashMap;
use tracing::debug;
use wither::mongodb::options::FindOptions;

use crate::errors::Error;
use crate::errors::NotFound;
use crate::lib::database_model::ModelExt;
use crate::lib::to_object_id::to_object_id;
use crate::models::application::Application;
use crate::models::endpoint::Endpoint;
use crate::models::feed::Feed;
use crate::models::subscription::{PublicSubscription, Subscription};

pub fn create_router() -> Router {
  Router::new()
    .route("/subscriptions", post(create_subscription))
    .route("/subscriptions", get(query_subscriptions))
    .route("/subscriptions/:id", get(get_subscription_by_id))
    .route("/subscriptions/:id", delete(remove_subscription_by_id))
}

async fn create_subscription(
  Json(payload): Json<CreateSubscription>,
  Extension(application): Extension<Application>,
) -> Result<Json<PublicSubscription>, Error> {
  let endpoint_id = to_object_id(payload.endpoint)?;
  let application_id = application.id.unwrap();

  let endpoint = Endpoint::find_one(
    doc! { "application": &application_id, "_id": endpoint_id },
    None,
  )
  .await?;

  if endpoint.is_none() {
    return Err(Error::NotFound(NotFound::new("endpoint")));
  }

  // Feeds are global, not attached to any user
  let feed = Feed::find_one(doc! { "url": &payload.url }, None).await?;

  let feed = match feed {
    Some(feed) => feed,
    None => {
      let feed = Feed::from_url(payload.url.clone()).await;
      Feed::create(feed).await?
    }
  };

  let feed_id = feed.id.unwrap();
  let metadata = payload.metadata;
  let subscription = Subscription::new(application_id, feed_id, endpoint_id, payload.url, metadata);
  let subscription = Subscription::create(subscription).await?;
  let res = PublicSubscription::from(subscription);

  Ok(Json(res))
}

async fn query_subscriptions(
  Extension(application): Extension<Application>,
) -> Result<Json<Vec<PublicSubscription>>, Error> {
  let application_id = application.id.unwrap();

  let options = FindOptions::builder()
    .sort(doc! { "created_at": -1 })
    .limit(50)
    .build();

  let subscriptions = Subscription::find(doc! { "application": &application_id }, Some(options))
    .await?
    .into_iter()
    .map(Into::into)
    .collect::<Vec<PublicSubscription>>();

  debug!("Returning subscriptions");
  Ok(Json(subscriptions))
}

async fn get_subscription_by_id(
  Extension(application): Extension<Application>,
  Path(params): Path<HashMap<String, String>>,
) -> Result<Json<PublicSubscription>, Error> {
  let application_id = application.id.unwrap();

  let subscription_id = params.get("id").unwrap().to_owned();
  let subscription_id = to_object_id(subscription_id)?;

  let subscription = Subscription::find_one(
    doc! { "_id": subscription_id, "application": &application_id },
    None,
  )
  .await?
  .map(PublicSubscription::from);

  let subscription = match subscription {
    Some(subscription) => subscription,
    None => {
      debug!("subscription not found, returning 404 status code");
      return Err(Error::NotFound(NotFound::new("subscription")));
    }
  };

  debug!("Returning subscription");
  Ok(Json(subscription))
}

async fn remove_subscription_by_id(
  Extension(application): Extension<Application>,
  Path(params): Path<HashMap<String, String>>,
) -> Result<(), Error> {
  let application_id = application.id.unwrap();

  let subscription_id = params.get("id").unwrap().to_owned();
  let subscription_id = to_object_id(subscription_id)?;

  let delete_result =
    Subscription::delete_one(doc! { "_id": subscription_id, "application": &application_id })
      .await?;

  if delete_result.deleted_count == 0 {
    debug!("subscription not found, returning 404 status code");
    return Err(Error::NotFound(NotFound::new("subscription")));
  }

  Ok(())
}

#[derive(Deserialize)]
struct CreateSubscription {
  url: String,
  endpoint: String,
  metadata: Option<JsonValue>,
}
