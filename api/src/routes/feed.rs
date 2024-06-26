use axum::{extract::Query, routing::get, Json, Router};
use bson::doc;
use serde::{Deserialize, Serialize};
use tracing::debug;

use crate::errors::Error;
use crate::models::entry::PublicEntry;
use crate::models::feed::FeedType;
use crate::utils::get_feed::get_feed;
use crate::utils::to_url::to_url;

pub fn create_router() -> Router {
  Router::new().route("/feeds", get(get_feed_by_url))
}

async fn get_feed_by_url(query: Query<GetFeedQuery>) -> Result<Json<FeedResponse>, Error> {
  let url = query.url.clone();
  let url = to_url(url)?;
  let raw_feed = get_feed(url.to_string()).await?;
  let feed = FeedResponse::from_raw_feed(raw_feed);

  debug!("Returning feed");
  Ok(Json(feed))
}

#[derive(Serialize, Deserialize)]
pub struct FeedResponse {
  pub feed_type: FeedType,
  pub title: Option<String>,
  pub description: Option<String>,
  pub entries: Vec<PublicEntry>,
}

impl FeedResponse {
  pub fn from_raw_feed(feed: feed_rs::model::Feed) -> Self {
    FeedResponse {
      feed_type: feed.feed_type.into(),
      title: feed.title.clone().map(|title| title.content),
      description: feed
        .description
        .clone()
        .map(|description| description.content),
      entries: feed.entries.into_iter().map(Into::into).collect(),
    }
  }
}

#[derive(Deserialize)]
struct GetFeedQuery {
  url: String,
}
