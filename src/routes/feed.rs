use axum::{
  extract::{Extension, Path, Query},
  routing::{delete, get},
  Json, Router,
};
use bson::doc;
use bson::oid::ObjectId;
use serde::{Deserialize, Serialize};
use tokio::try_join;
use tracing::debug;

use crate::context::Context;
use crate::errors::Error;
use crate::errors::NotFound;
use crate::lib::database_model::ModelExt;
use crate::lib::to_object_id::to_object_id;
use crate::lib::to_url::to_url;
use crate::lib::token::TokenUser;
use crate::models::feed::Feed;
use crate::models::feed::PublicFeed;
use crate::models::subscription::PublicSubscription;

pub fn create_route() -> Router {
  Router::new()
    // TODO: make these routes only accesibble by admins
    .route("/feeds", get(query_feed))
    .route("/feeds/:id", get(get_feed_by_id))
    // TODO: enable this rounte only in debug mode
    .route("/feeds/:id", delete(remove_feed_by_id))
    .route("/parse-feed", get(parse_feed))
}

async fn query_feed(
  _user: TokenUser,
  Extension(context): Extension<Context>,
) -> Result<Json<Vec<PublicFeed>>, Error> {
  let feeds = context
    .models
    .feed
    .find(doc! {}, None)
    .await?
    .into_iter()
    .map(Into::into)
    .collect::<Vec<PublicFeed>>();

  debug!("Returning feeds");
  Ok(Json(feeds))
}

#[derive(Serialize, Deserialize)]
pub struct FeedResponse {
  pub feed: PublicFeed,
  // TODO: how to use `serialize_with = "serialize_object_id_as_hex_string"`
  //       on the elements of the vector?
  pub subscriptions: Vec<ObjectId>,
}

async fn get_feed_by_id(
  _user: TokenUser,
  Extension(context): Extension<Context>,
  Path(id): Path<String>,
) -> Result<Json<FeedResponse>, Error> {
  let feed_id = to_object_id(id)?;

  let feed = context.models.feed.find_one(doc! { "_id": feed_id }, None);

  let subscriptions = context
    .models
    .subscription
    .find(doc! { "feed": feed_id }, None);

  let (feed, subscriptions) = try_join!(feed, subscriptions)?;

  let feed = match feed.map(PublicFeed::from) {
    Some(feed) => feed,
    None => {
      debug!("feed not found, returning 404 status code");
      return Err(Error::NotFound(NotFound::new("feed")));
    }
  };

  let subscriptions = subscriptions
    .into_iter()
    .map(Into::into)
    .map(|s: PublicSubscription| s.id)
    .collect::<Vec<ObjectId>>();

  let res = FeedResponse {
    feed,
    subscriptions,
  };

  debug!("Returning feed");
  Ok(Json(res))
}

async fn remove_feed_by_id(
  _user: TokenUser,
  Extension(context): Extension<Context>,
  Path(id): Path<String>,
) -> Result<(), Error> {
  let feed_id = to_object_id(id)?;
  let delete_result = context
    .models
    .feed
    .delete_one(doc! { "_id": feed_id })
    .await?;

  if delete_result.deleted_count == 0 {
    debug!("feed not found, returning 404 status code");
    return Err(Error::NotFound(NotFound::new("feed")));
  }

  Ok(())
}

async fn parse_feed(query: Query<ParseUrlQuery>) -> Result<Json<Feed>, Error> {
  let url = query.url.clone();
  let url = to_url(url)?;

  let feed = Feed::from_url(url.to_string()).await;

  // TODO: Return a proper response.
  debug!("Returning feed");
  Ok(Json(feed))
}

#[derive(Deserialize)]
struct ParseUrlQuery {
  url: String,
}
