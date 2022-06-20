use axum::{
  async_trait,
  extract::{Extension, FromRequest, Path, RequestParts},
};
use bson::doc;
use http::StatusCode;
use std::collections::HashMap;
use tracing::error;

use crate::lib::database_model::ModelExt;
use crate::lib::to_object_id::to_object_id;
use crate::lib::token::UserFromToken;
use crate::models::application::Application;

pub struct AuthenticateApplication;

#[async_trait]
impl<B> FromRequest<B> for AuthenticateApplication
where
  B: Send,
{
  type Rejection = StatusCode;

  async fn from_request(req: &mut RequestParts<B>) -> Result<Self, Self::Rejection> {
    let Extension(user): Extension<UserFromToken> =
      Extension::from_request(req).await.map_err(|_err| {
        // This should not happen. The authentication middleware should run
        // before this middleware and populate the user into the request
        // extensions.
        error!("No user found in the req extensions on the application middleware");
        StatusCode::INTERNAL_SERVER_ERROR
      })?;

    let Path(params) = Path::<HashMap<String, String>>::from_request(req)
      .await
      .map_err(|_err| {
        // This should not happen. This middleware must be run on the
        // "/applications/:application_id" routes.
        error!("No params found in the req path on the application middleware");
        StatusCode::INTERNAL_SERVER_ERROR
      })?;

    let application_id = match params.get("application_id") {
      Some(id) => id,
      None => {
        // This should not happen. This middleware must be run on the
        // "/applications/:application_id" routes.
        error!("No application_id param found in the req path on the application middleware");
        return Err(StatusCode::INTERNAL_SERVER_ERROR);
      }
    };

    let application_id = match to_object_id(application_id) {
      Ok(id) => id,
      Err(_) => return Err(StatusCode::BAD_REQUEST),
    };

    let application = Application::find_one(doc! { "_id": application_id, "user": &user.id }, None)
      .await
      .unwrap();

    let application = match application {
      Some(application) => application,
      None => return Err(StatusCode::NOT_FOUND),
    };

    // Store the Application in the request extensions to allow accessing it
    // from other middlewares.
    req.extensions_mut().insert(application);

    Ok(Self)
  }
}
