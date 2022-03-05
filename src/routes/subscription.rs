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
use crate::models::feed::Feed;
use crate::models::subscription::{PublicSubscription, Subscription};
use crate::models::webhook::Webhook;
use crate::models::ModelExt;

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
  let subscription = context
    .models
    .subscription
    .find_one(doc! { "user": &user.id, "url": &payload.url }, None)
    .await?;

  if let Some(subscription) = subscription {
    return Ok(Json(PublicSubscription::from(subscription)));
  }

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

  let webhook = match payload.webhook {
    SubscriptionWebhook::Url { url, title } => {
      let webhook = Webhook::new(user.id, url, title);
      context.models.webhook.create(webhook).await?
    }

    SubscriptionWebhook::Webhook { id } => {
      let webhook_id = to_object_id(id)?;
      let webhook = context
        .models
        .webhook
        .find_one(doc! { "user": &user.id, "_id": webhook_id }, None)
        .await?;

      match webhook {
        Some(webhook) => webhook,
        None => {
          return Err(Error::NotFound(NotFound::new("webhook")));
        }
      }
    }
  };

  let feed_id = feed.id.expect("existing feed should have an id");
  let webhook_id = webhook.id.expect("existing webhook should have an id");
  let subscription = Subscription::new(user.id, feed_id, webhook_id, payload.url);
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
      return Err(Error::NotFound(NotFound::new("subscription")));
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
    return Err(Error::NotFound(NotFound::new("subscription")));
  }

  Ok(())
}

#[derive(Deserialize)]
#[serde(untagged)]
enum SubscriptionWebhook {
  Url { url: String, title: String },
  Webhook { id: String },
}

#[derive(Deserialize)]
struct CreateSubscription {
  url: String,
  webhook: SubscriptionWebhook,
}
