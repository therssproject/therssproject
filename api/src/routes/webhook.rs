use axum::{extract::Extension, extract::Query, routing::get, Router};
use bson::doc;
use tracing::debug;
use wither::mongodb::options::FindOptions;

use crate::errors::BadRequest;
use crate::errors::Error;
use crate::lib::custom_response::{CustomResponse, CustomResponseBuilder};
use crate::lib::database_model::ModelExt;
use crate::lib::date::from_iso;
use crate::lib::pagination::PaginationBuilder;
use crate::lib::request_query::RequestQuery;
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

  let (webhooks, count) = Webhook::find_and_count(query, Some(options)).await?;

  let webhooks = webhooks
    .into_iter()
    .map(Into::into)
    .collect::<Vec<PublicWebhook>>();

  let res = CustomResponseBuilder::new()
    .body(webhooks)
    .pagination(pagination.count(count).build())
    .build();

  debug!("Returning webhooks");
  Ok(res)
}

fn to_date<A>(iso: A) -> Result<chrono::DateTime<chrono::Utc>, BadRequest>
where
  A: AsRef<str>,
{
  from_iso(iso.as_ref()).map_err(|_e| BadRequest::new("from", "Invalid ISO string date"))
}
