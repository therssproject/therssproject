use axum::{extract::Extension, routing::get, Json, Router};
use bson::doc;
use tracing::debug;
use wither::mongodb::options::FindOptions;

use crate::errors::Error;
use crate::lib::database_model::ModelExt;
use crate::lib::paginated_response::PaginatedJson;
use crate::models::application::Application;
use crate::models::webhook::{PublicWebhook, Webhook};

pub fn create_router() -> Router {
  Router::new().route("/webhooks", get(query_webhooks))
}

async fn query_webhooks(
  Extension(application): Extension<Application>,
) -> Result<PaginatedJson<Vec<PublicWebhook>>, Error> {
  let application_id = application.id.unwrap();

  let options = FindOptions::builder()
    .sort(doc! { "created_at": -1 })
    .limit(50)
    .build();

  let (webhooks, count) =
    Webhook::find_and_count(doc! { "application": &application_id}, Some(options)).await?;

  let webhooks = webhooks
    .into_iter()
    .map(Into::into)
    .collect::<Vec<PublicWebhook>>();

  debug!("Returning webhooks");
  let res = PaginatedJson {
    body: webhooks,
    count,
    offset: 0,
    limit: 50,
  };

  Ok(res)
}
