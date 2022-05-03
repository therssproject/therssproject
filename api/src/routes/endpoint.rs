use axum::extract::{Extension, Path};
use axum::routing::{delete, get, post, put};
use axum::Json;
use axum::Router;
use bson::doc;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tracing::debug;

use crate::context::Context;
use crate::errors::Error;
use crate::errors::NotFound;
use crate::lib::database_model::ModelExt;
use crate::lib::date::{now, Date};
use crate::lib::to_object_id::to_object_id;
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
  Extension(context): Extension<Context>,
  Json(payload): Json<CreateEndpoint>,
  Path(params): Path<HashMap<String, String>>,
) -> Result<Json<PublicEndpoint>, Error> {
  let application_id = params.get("application_id").unwrap().to_owned();
  let application_id = to_object_id(application_id).unwrap();
  let endpoint = Endpoint::new(application_id, payload.url, payload.title);
  let endpoint = context.models.endpoint.create(endpoint).await?;
  let res = PublicEndpoint::from(endpoint);

  Ok(Json(res))
}

async fn query_endpoint(
  Extension(context): Extension<Context>,
  Path(params): Path<HashMap<String, String>>,
) -> Result<Json<Vec<PublicEndpoint>>, Error> {
  let application_id = params.get("application_id").unwrap().to_owned();
  let application_id = to_object_id(application_id).unwrap();

  let endpoints = context
    .models
    .endpoint
    .find(doc! { "application": application_id }, None)
    .await?
    .into_iter()
    .map(Into::into)
    .collect::<Vec<PublicEndpoint>>();

  debug!("Returning endpoints");
  Ok(Json(endpoints))
}

async fn get_endpoint_by_id(
  Extension(context): Extension<Context>,
  Path(params): Path<HashMap<String, String>>,
) -> Result<Json<PublicEndpoint>, Error> {
  let application_id = params.get("application_id").unwrap().to_owned();
  let application_id = to_object_id(application_id).unwrap();

  let endpoint_id = params.get("id").unwrap().to_owned();
  let endpoint_id = to_object_id(endpoint_id)?;

  let endpoint = context
    .models
    .endpoint
    .find_one(
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
  Extension(context): Extension<Context>,
  Path(params): Path<HashMap<String, String>>,
  Json(payload): Json<CreateEndpoint>,
) -> Result<(), Error> {
  let application_id = params.get("application_id").unwrap().to_owned();
  let application_id = to_object_id(application_id).unwrap();

  let endpoint_id = params.get("id").unwrap().to_owned();
  let endpoint_id = to_object_id(endpoint_id)?;

  let update = UpdateEndpoint::new(payload.title, payload.url);
  let update = bson::to_document(&update).unwrap();

  let result = context
    .models
    .endpoint
    .update_one(
      doc! { "_id": endpoint_id, "application": application_id },
      doc! { "$set": update },
      None,
    )
    .await?;

  if result.modified_count == 0 {
    debug!("endpoint not found, returning 404 status code");
    return Err(Error::NotFound(NotFound::new("endpoint")));
  }

  Ok(())
}

async fn remove_endpoint_by_id(
  Extension(context): Extension<Context>,
  Path(params): Path<HashMap<String, String>>,
) -> Result<(), Error> {
  let application_id = params.get("application_id").unwrap().to_owned();
  let application_id = to_object_id(application_id).unwrap();

  let endpoint_id = params.get("id").unwrap().to_owned();
  let endpoint_id = to_object_id(endpoint_id)?;

  let delete_result = context
    .models
    .endpoint
    .delete_one(doc! { "_id": endpoint_id, "application": application_id })
    .await?;

  if delete_result.deleted_count == 0 {
    debug!("endpoint not found, returning 404 status code");
    return Err(Error::NotFound(NotFound::new("endpoint")));
  }

  Ok(())
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