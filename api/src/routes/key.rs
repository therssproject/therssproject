use axum::extract::{Extension, Path};
use axum::routing::{delete, get, post};
use axum::Json;
use axum::Router;
use bson::doc;
use serde::Deserialize;
use std::collections::HashMap;
use tracing::debug;

use crate::errors::Error;
use crate::errors::NotFound;
use crate::lib::database_model::ModelExt;
use crate::lib::to_object_id::to_object_id;
use crate::models::application::Application;
use crate::models::key::{Key, PublicKey};

pub fn create_router() -> Router {
  Router::new()
    .route("/keys", post(create_key))
    .route("/keys", get(query_key))
    .route("/keys/:id", delete(remove_key_by_id))
}

async fn create_key(
  Json(payload): Json<CreateKey>,
  Extension(application): Extension<Application>,
) -> Result<Json<PublicKey>, Error> {
  let application_id = application.id.unwrap();

  let key = Key::new(application_id, payload.title);
  let key = Key::create(key).await?;
  let res = PublicKey::from(key);

  Ok(Json(res))
}

async fn query_key(
  Extension(application): Extension<Application>,
) -> Result<Json<Vec<PublicKey>>, Error> {
  let application_id = application.id.unwrap();

  let keys = Key::find(doc! { "application": application_id }, None)
    .await?
    .into_iter()
    .map(Into::into)
    .collect::<Vec<PublicKey>>();

  debug!("Returning keys");
  Ok(Json(keys))
}

async fn remove_key_by_id(
  Path(params): Path<HashMap<String, String>>,
  Extension(application): Extension<Application>,
) -> Result<(), Error> {
  let application_id = application.id.unwrap();

  let key_id = params.get("id").unwrap().to_owned();
  let key_id = to_object_id(key_id)?;

  let delete_result =
    Key::delete_one(doc! { "_id": key_id, "application": application_id }).await?;

  if delete_result.deleted_count == 0 {
    debug!("Key not found, returning 404 status code");
    return Err(Error::NotFound(NotFound::new("key")));
  }

  Ok(())
}

#[derive(Deserialize)]
struct CreateKey {
  title: String,
}
