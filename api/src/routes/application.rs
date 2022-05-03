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
use crate::lib::database_model::ModelExt;
use crate::lib::to_object_id::to_object_id;
use crate::lib::token::UserFromToken;
use crate::models::application::{Application, PublicApplication};

pub fn create_router() -> Router {
  Router::new()
    .route("/", post(create_application))
    .route("/", get(query_application))
    .route("/:application_id", get(get_application_by_id))
    .route("/:application_id", delete(remove_application_by_id))
}

async fn create_application(
  user: UserFromToken,
  Extension(context): Extension<Context>,
  Json(payload): Json<CreateApplication>,
) -> Result<Json<PublicApplication>, Error> {
  let application = Application::new(user.id, payload.name, payload.description);
  let application = context.models.application.create(application).await?;
  let res = PublicApplication::from(application);

  Ok(Json(res))
}

async fn query_application(
  user: UserFromToken,
  Extension(context): Extension<Context>,
) -> Result<Json<Vec<PublicApplication>>, Error> {
  let applications = context
    .models
    .application
    .find(doc! { "user": &user.id }, None)
    .await?
    .into_iter()
    .map(Into::into)
    .collect::<Vec<PublicApplication>>();

  debug!("Returning applications");
  Ok(Json(applications))
}

async fn get_application_by_id(
  user: UserFromToken,
  Extension(context): Extension<Context>,
  Path(id): Path<String>,
) -> Result<Json<PublicApplication>, Error> {
  let application_id = to_object_id(id)?;
  let application = context
    .models
    .application
    .find_one(doc! { "_id": application_id, "user": &user.id }, None)
    .await?
    .map(PublicApplication::from);

  let application = match application {
    Some(application) => application,
    None => {
      debug!("Application not found, returning 404 status code");
      return Err(Error::NotFound(NotFound::new("application")));
    }
  };

  debug!("Returning application");
  Ok(Json(application))
}

async fn remove_application_by_id(
  user: UserFromToken,
  Extension(context): Extension<Context>,
  Path(id): Path<String>,
) -> Result<(), Error> {
  let application_id = to_object_id(id)?;
  let delete_result = context
    .models
    .application
    .delete_one(doc! { "_id": application_id, "user": &user.id })
    .await?;

  if delete_result.deleted_count == 0 {
    debug!("Application not found, returning 404 status code");
    return Err(Error::NotFound(NotFound::new("application")));
  }

  Ok(())
}

#[derive(Deserialize)]
struct CreateApplication {
  name: String,
  description: Option<String>,
}
