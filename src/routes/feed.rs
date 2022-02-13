use axum::{
  extract::{Extension, Path},
  routing::delete,
  Router,
};
use bson::doc;
use tracing::debug;

use crate::context::Context;
use crate::errors::Error;
use crate::errors::NotFound;
use crate::lib::to_object_id::to_object_id;
use crate::lib::token::TokenUser;
use crate::models::ModelExt;

pub fn create_route() -> Router {
  Router::new().route("/feeds/:id", delete(remove_feed_by_id))
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
    return Err(Error::NotFound(NotFound::new(String::from("feed"))));
  }

  Ok(())
}
