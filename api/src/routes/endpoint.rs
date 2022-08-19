use axum::extract::{Extension, Path, Query};
use axum::http::StatusCode;
use axum::routing::{delete, get, patch, post};
use axum::Json;
use axum::Router;
use bson::doc;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tracing::debug;
use wither::mongodb::options::FindOptions;

use crate::errors::BadRequest;
use crate::errors::Error;
use crate::errors::NotFound;
use crate::lib::custom_response::{CustomResponse, CustomResponseBuilder};
use crate::lib::database_model::ModelExt;
use crate::lib::date::from_iso;
use crate::lib::date::{now, Date};
use crate::lib::pagination::PaginationBuilder;
use crate::lib::request_query::RequestQuery;
use crate::lib::to_object_id::to_object_id;
use crate::models::application::Application;
use crate::models::endpoint::{Endpoint, PublicEndpoint};

pub fn create_router() -> Router {
  Router::new()
    .route("/endpoints", post(create_endpoint))
    .route("/endpoints", get(query_endpoint))
    .route("/endpoints/:id", get(get_endpoint_by_id))
    .route("/endpoints/:id", patch(update_endpoint_by_id))
    .route("/endpoints/:id", delete(remove_endpoint_by_id))
}

async fn create_endpoint(
  Json(payload): Json<CreateEndpoint>,
  Extension(application): Extension<Application>,
) -> Result<CustomResponse<PublicEndpoint>, Error> {
  let application_id = application.id.unwrap();

  let endpoint = Endpoint::new(application_id, payload.url, payload.title);
  let endpoint = Endpoint::create(endpoint).await?;
  let res = PublicEndpoint::from(endpoint);

  let res = CustomResponseBuilder::new()
    .body(res)
    .status_code(StatusCode::CREATED)
    .build();

  Ok(res)
}

async fn query_endpoint(
  Extension(application): Extension<Application>,
  Query(query): Query<RequestQuery>,
) -> Result<CustomResponse<Vec<PublicEndpoint>>, Error> {
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

  let (endpoints, count) = Endpoint::find_and_count(query, options).await?;
  let endpoints = endpoints
    .into_iter()
    .map(Into::into)
    .collect::<Vec<PublicEndpoint>>();

  let res = CustomResponseBuilder::new()
    .body(endpoints)
    .pagination(pagination.count(count).build())
    .build();

  debug!("Returning endpoints");
  Ok(res)
}

async fn get_endpoint_by_id(
  Path(params): Path<HashMap<String, String>>,
  Extension(application): Extension<Application>,
) -> Result<Json<PublicEndpoint>, Error> {
  let application_id = application.id.unwrap();

  let endpoint_id = params.get("id").unwrap().to_owned();
  let endpoint_id = to_object_id(endpoint_id)?;

  let endpoint = Endpoint::find_one(
    doc! { "_id": endpoint_id, "application": application_id },
    None,
  )
  .await?
  .map(PublicEndpoint::from);

  let endpoint = match endpoint {
    Some(endpoint) => endpoint,
    None => {
      debug!("endpoint not found, returning 404 status code");
      return Err(Error::NotFound(NotFound::new("endpoint")));
    }
  };

  Ok(Json(endpoint))
}

async fn update_endpoint_by_id(
  Path(params): Path<HashMap<String, String>>,
  Json(payload): Json<CreateEndpoint>,
  Extension(application): Extension<Application>,
) -> Result<CustomResponse<()>, Error> {
  let application_id = application.id.unwrap();

  let endpoint_id = params.get("id").unwrap().to_owned();
  let endpoint_id = to_object_id(endpoint_id)?;

  let update = UpdateEndpoint::new(payload.title, payload.url);
  let update = bson::to_document(&update).unwrap();

  let result = Endpoint::update_one(
    doc! { "_id": endpoint_id, "application": application_id },
    doc! { "$set": update },
    None,
  )
  .await?;

  let was_found = result.matched_count == 1;
  if !was_found {
    debug!("Endpoint not found, returning 404 status code");
    return Err(Error::NotFound(NotFound::new("endpoint")));
  }

  let res = CustomResponseBuilder::new()
    .status_code(StatusCode::NO_CONTENT)
    .build();

  Ok(res)
}

async fn remove_endpoint_by_id(
  Path(params): Path<HashMap<String, String>>,
  Extension(application): Extension<Application>,
) -> Result<CustomResponse<()>, Error> {
  let application_id = application.id.unwrap();

  let endpoint_id = params.get("id").unwrap().to_owned();
  let endpoint_id = to_object_id(endpoint_id)?;

  let delete_result =
    Endpoint::delete_one(doc! { "_id": endpoint_id, "application": application_id }).await?;

  if delete_result.deleted_count == 0 {
    debug!("endpoint not found, returning 404 status code");
    return Err(Error::NotFound(NotFound::new("endpoint")));
  }

  let res = CustomResponseBuilder::new()
    .status_code(StatusCode::NO_CONTENT)
    .build();

  Ok(res)
}

#[derive(Deserialize)]
struct CreateEndpoint {
  url: String,
  title: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateEndpoint {
  pub title: Option<String>,
  pub url: Option<String>,
  pub updated_at: Date,
}

impl UpdateEndpoint {
  pub fn new<S>(title: S, url: S) -> Self
  where
    S: Into<Option<String>>,
  {
    Self {
      title: title.into(),
      url: url.into(),
      updated_at: now(),
    }
  }
}

fn to_date<A>(iso: A) -> Result<chrono::DateTime<chrono::Utc>, BadRequest>
where
  A: AsRef<str>,
{
  from_iso(iso.as_ref()).map_err(|_e| BadRequest::new("from", "Invalid ISO string date"))
}
