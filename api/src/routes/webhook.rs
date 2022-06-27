use axum::{extract::Extension, routing::get, Json, Router};
use bson::doc;
use tracing::debug;
use wither::mongodb::options::FindOptions;

use crate::errors::Error;
use crate::lib::database_model::ModelExt;
use crate::models::application::Application;
use crate::models::webhook::{PublicWebhook, Webhook};

pub fn create_router() -> Router {
  Router::new().route("/webhooks", get(query_webhooks))
}

async fn query_webhooks(
  Extension(application): Extension<Application>,
) -> Result<Json<Vec<PublicWebhook>>, Error> {
  let application_id = application.id.unwrap();

  let options = FindOptions::builder()
    .sort(doc! { "created_at": -1 })
    .limit(100)
    .build();

  let webhooks = Webhook::find(doc! { "application": &application_id }, Some(options))
    .await?
    .into_iter()
    .map(Into::into)
    .collect::<Vec<PublicWebhook>>();

  debug!("Returning webhooks");
  Ok(Json(webhooks))
}
