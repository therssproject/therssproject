use axum::extract::{Extension, Path, Query};
use axum::http::StatusCode;
use axum::routing::{delete, get, post};
use axum::Json;
use axum::Router;
use bson::serde_helpers::bson_datetime_as_rfc3339_string;
use bson::serde_helpers::serialize_object_id_as_hex_string;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tracing::debug;
use wither::bson::{doc, oid::ObjectId};
use wither::mongodb::options::FindOptions;

use crate::errors::BadRequest;
use crate::errors::Error;
use crate::errors::NotFound;
use crate::lib::custom_response::{CustomResponse, CustomResponseBuilder};
use crate::lib::database_model::ModelExt;
use crate::lib::date::from_iso;
use crate::lib::date::Date;
use crate::lib::pagination::PaginationBuilder;
use crate::lib::request_query::RequestQuery;
use crate::lib::serde::bson_datetime_option_as_rfc3339_string;
use crate::lib::to_object_id::to_object_id;
use crate::lib::token::UserFromToken;
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
  Extension(user): Extension<UserFromToken>,
) -> Result<CustomResponse<CreateKeyResponse>, Error> {
  let application_id = application.id.unwrap();

  let created_by = user.id;
  let (key, unhashed_key) = Key::new(&application_id, payload.title, &created_by);
  let key = Key::create(key).await?;
  let key = PublicKey::from(key);
  let res = CreateKeyResponse::from_public_key(key, unhashed_key);

  let res = CustomResponseBuilder::new()
    .body(res)
    .status_code(StatusCode::CREATED)
    .build();

  Ok(res)
}

async fn query_key(
  Extension(application): Extension<Application>,
  Query(query): Query<RequestQuery>,
) -> Result<CustomResponse<Vec<PublicKey>>, Error> {
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

  let (keys, count) = Key::find_and_count(query, Some(options)).await?;
  let keys = keys.into_iter().map(Into::into).collect::<Vec<PublicKey>>();

  let res = CustomResponseBuilder::new()
    .body(keys)
    .pagination(pagination.count(count).build())
    .build();

  debug!("Returning keys");
  Ok(res)
}

async fn remove_key_by_id(
  Path(params): Path<HashMap<String, String>>,
  Extension(application): Extension<Application>,
) -> Result<CustomResponse<()>, Error> {
  let application_id = application.id.unwrap();

  let key_id = params.get("id").unwrap().to_owned();
  let key_id = to_object_id(key_id)?;

  let delete_result =
    Key::delete_one(doc! { "_id": key_id, "application": application_id }).await?;

  if delete_result.deleted_count == 0 {
    debug!("Key not found, returning 404 status code");
    return Err(Error::NotFound(NotFound::new("key")));
  }

  let res = CustomResponseBuilder::new()
    .status_code(StatusCode::NO_CONTENT)
    .build();

  Ok(res)
}

#[derive(Deserialize)]
struct CreateKey {
  title: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateKeyResponse {
  #[serde(alias = "_id", serialize_with = "serialize_object_id_as_hex_string")]
  pub id: ObjectId,
  #[serde(serialize_with = "serialize_object_id_as_hex_string")]
  pub application: ObjectId,
  pub key: String,
  pub title: String,
  #[serde(serialize_with = "bson_datetime_option_as_rfc3339_string")]
  pub used_at: Option<Date>,
  #[serde(with = "bson_datetime_as_rfc3339_string")]
  pub created_at: Date,
  #[serde(serialize_with = "serialize_object_id_as_hex_string")]
  pub created_by: ObjectId,
}

impl CreateKeyResponse {
  pub fn from_public_key(key: PublicKey, unhashed_key: String) -> Self {
    Self {
      id: key.id,
      application: key.application,
      title: key.title,
      key: unhashed_key,
      used_at: key.used_at,
      created_at: key.created_at,
      created_by: key.created_by,
    }
  }
}

fn to_date<A>(iso: A) -> Result<chrono::DateTime<chrono::Utc>, BadRequest>
where
  A: AsRef<str>,
{
  from_iso(iso.as_ref()).map_err(|_e| BadRequest::new("from", "Invalid ISO string date"))
}
