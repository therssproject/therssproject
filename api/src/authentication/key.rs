use axum::{
  async_trait,
  extract::{FromRequest, RequestParts},
};
use bson::doc;
use http::header;
use http::StatusCode;

use crate::lib::database_model::ModelExt;
use crate::models::application::Application;
use crate::models::key::Key;

pub struct AuthenticateKey;

#[async_trait]
impl<B> FromRequest<B> for AuthenticateKey
where
  B: Send,
{
  type Rejection = StatusCode;

  async fn from_request(req: &mut RequestParts<B>) -> Result<Self, Self::Rejection> {
    let auth_header = req
      .headers()
      .get(header::AUTHORIZATION)
      .and_then(|value| value.to_str().ok());

    let key = match auth_header {
      Some(auth_header) => auth_header,
      None => return Err(StatusCode::UNAUTHORIZED),
    };

    let key = Key::find_one(doc! { "key": key }, None).await.unwrap();
    let key = match key {
      Some(key) => key,
      None => return Err(StatusCode::UNAUTHORIZED),
    };

    let application = Application::find_by_id(&key.application)
      .await
      .unwrap()
      .unwrap();

    // Store the Application in the request extensions to allow accessing it
    // from other middlewares.
    req.extensions_mut().insert(application);

    Ok(Self)
  }
}
