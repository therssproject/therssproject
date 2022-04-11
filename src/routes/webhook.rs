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
use crate::models::webhook::{PublicWebhook, Webhook};

pub fn create_router() -> Router {
  // TODO: Authenticate these requests based on the user and application
  // relationship / membership.
  Router::new()
    .route("/webhooks", post(create_webhook))
    .route("/webhooks", get(query_webhook))
    .route("/webhooks/:id", get(get_webhook_by_id))
    .route("/webhooks/:id", put(update_webhook_by_id))
    .route("/webhooks/:id", delete(remove_webhook_by_id))
}

async fn create_webhook(
  Extension(context): Extension<Context>,
  Json(payload): Json<CreateWebhook>,
  Path(params): Path<HashMap<String, String>>,
) -> Result<Json<PublicWebhook>, Error> {
  let application_id = params.get("application_id").unwrap().to_owned();
  let application_id = to_object_id(application_id).unwrap();
  let webhook = Webhook::new(application_id, payload.url, payload.title);
  let webhook = context.models.webhook.create(webhook).await?;
  let res = PublicWebhook::from(webhook);

  Ok(Json(res))
}

async fn query_webhook(
  Extension(context): Extension<Context>,
  Path(params): Path<HashMap<String, String>>,
) -> Result<Json<Vec<PublicWebhook>>, Error> {
  let application_id = params.get("application_id").unwrap().to_owned();
  let application_id = to_object_id(application_id).unwrap();

  let webhooks = context
    .models
    .webhook
    .find(doc! { "application": application_id }, None)
    .await?
    .into_iter()
    .map(Into::into)
    .collect::<Vec<PublicWebhook>>();

  debug!("Returning webhooks");
  Ok(Json(webhooks))
}

async fn get_webhook_by_id(
  Extension(context): Extension<Context>,
  Path(params): Path<HashMap<String, String>>,
) -> Result<Json<PublicWebhook>, Error> {
  let application_id = params.get("application_id").unwrap().to_owned();
  let application_id = to_object_id(application_id).unwrap();

  let webhook_id = params.get("id").unwrap().to_owned();
  let webhook_id = to_object_id(webhook_id)?;

  let webhook = context
    .models
    .webhook
    .find_one(
      doc! { "_id": webhook_id, "application": application_id },
      None,
    )
    .await?
    .map(PublicWebhook::from);

  let webhook = match webhook {
    Some(webhook) => webhook,
    None => {
      debug!("webhook not found, returning 404 status code");
      return Err(Error::NotFound(NotFound::new("webhook")));
    }
  };

  Ok(Json(webhook))
}

async fn update_webhook_by_id(
  Extension(context): Extension<Context>,
  Path(params): Path<HashMap<String, String>>,
  Json(payload): Json<CreateWebhook>,
) -> Result<(), Error> {
  let application_id = params.get("application_id").unwrap().to_owned();
  let application_id = to_object_id(application_id).unwrap();

  let webhook_id = params.get("id").unwrap().to_owned();
  let webhook_id = to_object_id(webhook_id)?;

  let update = UpdateWebhook::new(payload.title, payload.url);
  let update = bson::to_document(&update).unwrap();

  let result = context
    .models
    .webhook
    .update_one(
      doc! { "_id": webhook_id, "application": application_id },
      doc! { "$set": update },
      None,
    )
    .await?;

  if result.modified_count == 0 {
    debug!("webhook not found, returning 404 status code");
    return Err(Error::NotFound(NotFound::new("webhook")));
  }

  Ok(())
}

async fn remove_webhook_by_id(
  Extension(context): Extension<Context>,
  Path(params): Path<HashMap<String, String>>,
) -> Result<(), Error> {
  let application_id = params.get("application_id").unwrap().to_owned();
  let application_id = to_object_id(application_id).unwrap();

  let webhook_id = params.get("id").unwrap().to_owned();
  let webhook_id = to_object_id(webhook_id)?;

  let delete_result = context
    .models
    .webhook
    .delete_one(doc! { "_id": webhook_id, "application": application_id })
    .await?;

  if delete_result.deleted_count == 0 {
    debug!("webhook not found, returning 404 status code");
    return Err(Error::NotFound(NotFound::new("webhook")));
  }

  Ok(())
}

#[derive(Deserialize)]
struct CreateWebhook {
  url: String,
  title: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateWebhook {
  pub title: Option<String>,
  pub url: Option<String>,
  pub updated_at: Date,
}

impl UpdateWebhook {
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
