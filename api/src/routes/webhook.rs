use axum::{extract::Extension, extract::Query, routing::get, Router};
use bson::doc;
use serde::Deserialize;
use tracing::debug;
use wither::mongodb::options::FindOptions;

use crate::errors::BadRequest;
use crate::errors::Error;
use crate::lib::custom_response::{CustomResponse, CustomResponseBuilder, Pagination};
use crate::lib::database_model::ModelExt;
use crate::lib::date::from_iso;
use crate::models::application::Application;
use crate::models::webhook::{PublicWebhook, Webhook};

pub fn create_router() -> Router {
  Router::new().route("/webhooks", get(query_webhooks))
}

async fn query_webhooks(
  Extension(application): Extension<Application>,
  Query(query): Query<RequestQuery>,
) -> Result<CustomResponse<Vec<PublicWebhook>>, Error> {
  let application_id = application.id.unwrap();
  let from = query.from;

  let options = FindOptions::builder()
    .sort(doc! { "created_at": -1_i32 })
    .limit(50)
    .build();

  let mut query = doc! { "application": application_id };
  if let Some(from) = from {
    query.insert("created_at", doc! { "$gte": to_date(from)? });
  }

  let (webhooks, count) = Webhook::find_and_count(query, Some(options)).await?;

  let webhooks = webhooks
    .into_iter()
    .map(Into::into)
    .collect::<Vec<PublicWebhook>>();

  let res = CustomResponseBuilder::new()
    .body(webhooks)
    .pagination(Pagination {
      count,
      offset: 0,
      limit: 50,
    })
    .build();

  debug!("Returning webhooks");
  Ok(res)
}

#[derive(Deserialize)]
struct RequestQuery {
  from: Option<String>,
}

fn to_date<A>(iso: A) -> Result<chrono::DateTime<chrono::Utc>, BadRequest>
where
  A: AsRef<str>,
{
  from_iso(iso.as_ref()).map_err(|_e| BadRequest::new("from", "Invalid ISO string date"))
}
