use axum::{
  extract::{Extension, Path},
  routing::{delete, get, post},
  Json, Router,
};
use bson::doc;
use serde::Deserialize;
use tracing::debug;

use crate::context::Context;
use crate::errors::Error;
use crate::errors::NotFound;
use crate::lib::to_object_id::to_object_id;
use crate::lib::token::TokenUser;
use crate::lib::parse_rss::{parse_rss};
use crate::models::subscription::{PublicSubscription, Subscription};
use crate::models::ModelExt;
use crate::models::feed::{Feed, FeedType};

pub fn create_route() -> Router {
  Router::new()
    .route("/subscriptions", post(create_subscription))
    .route("/subscriptions", get(query_subscription))
    .route("/subscriptions/:id", get(get_subscription_by_id))
    .route("/subscriptions/:id", delete(remove_subscription_by_id))
}

async fn create_subscription(
  user: TokenUser,
  Extension(context): Extension<Context>,
  Json(payload): Json<CreateSubscription>,
) -> Result<Json<PublicSubscription>, Error> {
  let existing = context.models.subscription.find_one(doc! { "url": payload.url.clone() }, None).await?;

  if let Some(existing) = existing {
      return Ok(Json(PublicSubscription::from(existing)))
  }

  let feed = context
    .models
    .feed
    .find_one(doc! { "url": payload.url.clone() }, None)
    .await?;

  let feed = match feed {
      Some(f) => f,
      None => {
          let public_id = "public_id".to_string();
          let raw_feed = parse_rss(payload.url.clone()).await;
          let feed_type = FeedType::from(raw_feed.feed_type);

          let feed_fields = Feed::new(public_id, feed_type, payload.url.clone(), None);
          context.models.feed.create(feed_fields).await?
      }
  };

  let subscription = Subscription::new(user.id, feed.id.unwrap(), payload.url);
  let subscription = context.models.subscription.create(subscription).await?;
  let res = PublicSubscription::from(subscription);

  Ok(Json(res))
}

async fn query_subscription(
  user: TokenUser,
  Extension(context): Extension<Context>,
) -> Result<Json<Vec<PublicSubscription>>, Error> {
  let subscriptions = context
    .models
    .subscription
    .find(doc! { "user": &user.id }, None)
    .await?
    .into_iter()
    .map(Into::into)
    .collect::<Vec<PublicSubscription>>();

  debug!("Returning subscriptions");
  Ok(Json(subscriptions))
}

async fn get_subscription_by_id(
  user: TokenUser,
  Extension(context): Extension<Context>,
  Path(id): Path<String>,
) -> Result<Json<PublicSubscription>, Error> {
  let subscription_id = to_object_id(id)?;
  let subscription = context
    .models
    .subscription
    .find_one(doc! { "_id": subscription_id, "user": &user.id }, None)
    .await?
    .map(PublicSubscription::from);

  let subscription = match subscription {
    Some(subscription) => subscription,
    None => {
      debug!("subscription not found, returning 404 status code");
      return Err(Error::NotFound(NotFound::new(String::from("subscription"))));
    }
  };

  debug!("Returning subscription");
  Ok(Json(subscription))
}

async fn remove_subscription_by_id(
  user: TokenUser,
  Extension(context): Extension<Context>,
  Path(id): Path<String>,
) -> Result<(), Error> {
  let subscription_id = to_object_id(id)?;
  let delete_result = context
    .models
    .subscription
    .delete_one(doc! { "_id": subscription_id, "user": &user.id })
    .await?;

  if delete_result.deleted_count == 0 {
    debug!("subscription not found, returning 404 status code");
    return Err(Error::NotFound(NotFound::new(String::from("subscription"))));
  }

  Ok(())
}

#[derive(Deserialize)]
struct CreateSubscription {
  url: String,
}
