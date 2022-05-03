use axum::{
  extract::{Extension, Path},
  routing::{delete, get, post},
  Json, Router,
};
use bson::doc;
use serde::Deserialize;
use std::collections::HashMap;
use tracing::debug;

use crate::context::Context;
use crate::errors::Error;
use crate::errors::NotFound;
use crate::lib::database_model::ModelExt;
use crate::lib::to_object_id::to_object_id;
use crate::models::endpoint::Endpoint;
use crate::models::feed::Feed;
use crate::models::subscription::{PublicSubscription, Subscription};

pub fn create_router() -> Router {
  Router::new()
    .route("/subscriptions", post(create_subscription))
    .route("/subscriptions", get(query_subscription))
    .route("/subscriptions/:id", get(get_subscription_by_id))
    .route("/subscriptions/:id", delete(remove_subscription_by_id))
}

async fn create_subscription(
  Extension(context): Extension<Context>,
  Json(payload): Json<CreateSubscription>,
  Path(params): Path<HashMap<String, String>>,
) -> Result<Json<PublicSubscription>, Error> {
  let application_id = params.get("application_id").unwrap().to_owned();
  let application_id = to_object_id(application_id).unwrap();

  let feed = context
    .models
    .feed
    // Feeds are global, not attached to any user
    .find_one(doc! { "url": &payload.url }, None)
    .await?;

  let feed = match feed {
    Some(feed) => feed,
    None => {
      let feed = Feed::from_url(payload.url.clone()).await;
      context.models.feed.create(feed).await?
    }
  };

  let endpoint = match payload.endpoint {
    SubscriptionEndpoint::Url { url, title } => {
      let endpoint = Endpoint::new(application_id, url, title);
      context.models.endpoint.create(endpoint).await?
    }

    SubscriptionEndpoint::Endpoint { id } => {
      let endpoint_id = to_object_id(id)?;
      let endpoint = context
        .models
        .endpoint
        .find_one(
          doc! { "application": &application_id, "_id": endpoint_id },
          None,
        )
        .await?;

      match endpoint {
        Some(endpoint) => endpoint,
        None => {
          return Err(Error::NotFound(NotFound::new("endpoint")));
        }
      }
    }
  };

  let feed_id = feed.id.unwrap();
  let endpoint_id = endpoint.id.unwrap();
  let subscription = Subscription::new(application_id, feed_id, endpoint_id, payload.url);
  let subscription = context.models.subscription.create(subscription).await?;
  let res = PublicSubscription::from(subscription);

  Ok(Json(res))
}

async fn query_subscription(
  Extension(context): Extension<Context>,
  Path(params): Path<HashMap<String, String>>,
) -> Result<Json<Vec<PublicSubscription>>, Error> {
  let application_id = params.get("application_id").unwrap().to_owned();
  let application_id = to_object_id(application_id).unwrap();

  let subscriptions = context
    .models
    .subscription
    .find(doc! { "application": &application_id }, None)
    .await?
    .into_iter()
    .map(Into::into)
    .collect::<Vec<PublicSubscription>>();

  debug!("Returning subscriptions");
  Ok(Json(subscriptions))
}

async fn get_subscription_by_id(
  Extension(context): Extension<Context>,
  Path(params): Path<HashMap<String, String>>,
) -> Result<Json<PublicSubscription>, Error> {
  let application_id = params.get("application_id").unwrap().to_owned();
  let application_id = to_object_id(application_id).unwrap();

  let subscription_id = params.get("id").unwrap().to_owned();
  let subscription_id = to_object_id(subscription_id)?;

  let subscription = context
    .models
    .subscription
    .find_one(
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
  Extension(context): Extension<Context>,
  Path(params): Path<HashMap<String, String>>,
) -> Result<(), Error> {
  let application_id = params.get("application_id").unwrap().to_owned();
  let application_id = to_object_id(application_id).unwrap();

  let subscription_id = params.get("id").unwrap().to_owned();
  let subscription_id = to_object_id(subscription_id)?;

  let delete_result = context
    .models
    .subscription
    .delete_one(doc! { "_id": subscription_id, "application": &application_id })
    .await?;

  if delete_result.deleted_count == 0 {
    debug!("subscription not found, returning 404 status code");
    return Err(Error::NotFound(NotFound::new("subscription")));
  }

  Ok(())
}

#[derive(Deserialize)]
#[serde(untagged)]
enum SubscriptionEndpoint {
  Url { url: String, title: String },
  Endpoint { id: String },
}

#[derive(Deserialize)]
struct CreateSubscription {
  url: String,
  endpoint: SubscriptionEndpoint,
}
