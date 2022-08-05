use axum::extract::{Extension, Path};
use axum::http::StatusCode;
use axum::routing::{delete, get, post, put};
use axum::Json;
use axum::Router;
use bson::doc;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tracing::debug;

use crate::errors::Error;
use crate::errors::NotFound;
use crate::lib::custom_response::{CustomResponse, CustomResponseBuilder};
use crate::lib::database_model::ModelExt;
use crate::lib::date::{now, Date};
use crate::lib::to_object_id::to_object_id;
use crate::models::application::Application;
use crate::models::endpoint::{Endpoint, PublicEndpoint};

pub fn create_router() -> Router {
  Router::new()
    .route("/endpoints", post(create_endpoint))
    .route("/endpoints", get(query_endpoint))
    .route("/endpoints/:id", get(get_endpoint_by_id))
    .route("/endpoints/:id", put(update_endpoint_by_id))
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
) -> Result<Json<Vec<PublicEndpoint>>, Error> {
  let application_id = application.id.unwrap();

  let endpoints = Endpoint::find(doc! { "application": application_id }, None)
    .await?
    .into_iter()
    .map(Into::into)
    .collect::<Vec<PublicEndpoint>>();

  debug!("Returning endpoints");
  Ok(Json(endpoints))
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

  if result.modified_count == 0 {
    debug!("endpoint not found, returning 404 status code");
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
