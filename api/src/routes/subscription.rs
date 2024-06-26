use axum::http::StatusCode;
use axum::{
  extract::{Extension, Path, Query},
  routing::{delete, get, post},
  Json, Router,
};
use bson::doc;
use serde::Deserialize;
use serde_json::Value as JsonValue;
use std::collections::HashMap;
use tracing::debug;
use wither::mongodb::options::FindOptions;

use crate::errors::BadRequest;
use crate::errors::Error;
use crate::errors::NotFound;
use crate::models::application::Application;
use crate::models::endpoint::Endpoint;
use crate::models::feed::Feed;
use crate::models::subscription::{PublicSubscription, Subscription};
use crate::utils::custom_response::{CustomResponse, CustomResponseBuilder};
use crate::utils::database_model::ModelExt;
use crate::utils::date::from_iso;
use crate::utils::pagination::PaginationBuilder;
use crate::utils::request_query::RequestQuery;
use crate::utils::to_object_id::to_object_id;

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
) -> Result<CustomResponse<PublicSubscription>, Error> {
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

  let res = CustomResponseBuilder::new()
    .body(res)
    .status_code(StatusCode::CREATED)
    .build();

  Ok(res)
}

async fn query_subscriptions(
  Extension(application): Extension<Application>,
  Query(query): Query<RequestQuery>,
) -> Result<CustomResponse<Vec<PublicSubscription>>, Error> {
  let application_id = application.id.unwrap();
  let from = query.from.clone();
  let pagination = PaginationBuilder::from_request_query(query);

  let options = FindOptions::builder()
    .sort(doc! { "created_at": -1_i32 })
    .skip(pagination.offset)
    .limit(pagination.limit as i64)
    .build();

  let mut query = doc! { "application": application_id };
  if let Some(from) = from {
    query.insert("created_at", doc! { "$gte": to_date(from)? });
  }

  let (subscriptions, count) = Subscription::find_and_count(query, Some(options)).await?;

  let subscriptions = subscriptions
    .into_iter()
    .map(Into::into)
    .collect::<Vec<PublicSubscription>>();

  let res = CustomResponseBuilder::new()
    .body(subscriptions)
    .pagination(pagination.count(count).build())
    .build();

  debug!("Returning subscriptions");
  Ok(res)
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
) -> Result<CustomResponse<()>, Error> {
  let application_id = application.id.unwrap();
  let subscription_id = params.get("id").unwrap().to_owned();
  let subscription_id = to_object_id(subscription_id)?;

  let subscription = Subscription::find_one(
    doc! {
      "_id": &subscription_id,
      "application": application_id
    },
    None,
  )
  .await?;

  let subscription = match subscription {
    Some(subscription) => subscription,
    None => {
      debug!("subscription not found, returning 404 status code");
      return Err(Error::NotFound(NotFound::new("subscription")));
    }
  };

  subscription.remove().await?;

  let res = CustomResponseBuilder::new()
    .status_code(StatusCode::NO_CONTENT)
    .build();

  Ok(res)
}

#[derive(Deserialize)]
struct CreateSubscription {
  url: String,
  endpoint: String,
  metadata: Option<JsonValue>,
}

fn to_date<A>(iso: A) -> Result<chrono::DateTime<chrono::Utc>, BadRequest>
where
  A: AsRef<str>,
{
  from_iso(iso.as_ref()).map_err(|_e| BadRequest::new("from", "Invalid ISO string date"))
}
