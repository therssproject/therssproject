use axum::{
  extract::{Extension, Path},
  routing::{get, post},
  Json, Router,
};
use bson::doc;
use tracing::debug;

use crate::errors::Error;
use crate::errors::NotFound;
use crate::lib::database_model::ModelExt;
use crate::lib::to_object_id::to_object_id;
use crate::lib::token::UserFromToken;
use crate::models::application::{Application, PublicApplication};

pub fn create_router() -> Router {
  Router::new()
    .route("/", get(query_application))
    .route("/:application_id", get(get_application_by_id))
    .route("/:application_id/reset", post(reset_application_by_id))
}

async fn query_application(
  Extension(user): Extension<UserFromToken>,
) -> Result<Json<Vec<PublicApplication>>, Error> {
  let applications = Application::find(doc! { "owner": &user.id }, None)
    .await?
    .into_iter()
    .map(Into::into)
    .collect::<Vec<PublicApplication>>();

  debug!("Returning applications");
  Ok(Json(applications))
}

async fn get_application_by_id(
  Extension(user): Extension<UserFromToken>,
  Path(id): Path<String>,
) -> Result<Json<PublicApplication>, Error> {
  let application_id = to_object_id(id)?;
  let application = Application::find_one(doc! { "_id": application_id, "owner": &user.id }, None)
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

async fn reset_application_by_id(
  Extension(user): Extension<UserFromToken>,
  Path(id): Path<String>,
) -> Result<(), Error> {
  let application_id = to_object_id(id)?;
  let exists = Application::exists(doc! { "_id": application_id, "owner": &user.id }).await?;

  if !exists {
    debug!("Application not found, returning 404 status code");
    return Err(Error::NotFound(NotFound::new("application")));
  }

  Application::reset(&application_id).await?;

  Ok(())
}
