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
use crate::lib::to_object_id::to_object_id;
use crate::lib::token::TokenUser;
use crate::models::webhook::{PublicWebhook, Webhook};
use crate::models::ModelExt;

pub fn create_route() -> Router {
  Router::new()
    .route("/webhooks", post(create_webhook))
    .route("/webhooks", get(query_webhook))
    .route("/webhooks/:id", get(get_webhook_by_id))
    .route("/webhooks/:id", delete(remove_webhook_by_id))
}

async fn create_webhook(
  user: TokenUser,
  Extension(context): Extension<Context>,
  Json(payload): Json<CreateWebhook>,
) -> Result<Json<PublicWebhook>, Error> {
  let webhook = context
    .models
    .webhook
    .find_one(doc! { "url": &payload.url, "user": &user.id }, None)
    .await?;

  match webhook {
    Some(webhook) => Ok(Json(PublicWebhook::from(webhook))),

    None => {
      let webhook = Webhook::new(user.id, payload.url, payload.title);
      let webhook = context.models.webhook.create(webhook).await?;
      let res = PublicWebhook::from(webhook);

      Ok(Json(res))
    }
  }
}

async fn query_webhook(
  user: TokenUser,
  Extension(context): Extension<Context>,
) -> Result<Json<Vec<PublicWebhook>>, Error> {
  let webhooks = context
    .models
    .webhook
    .find(doc! { "user": &user.id }, None)
    .await?
    .into_iter()
    .map(Into::into)
    .collect::<Vec<PublicWebhook>>();

  debug!("Returning webhooks");
  Ok(Json(webhooks))
}

async fn get_webhook_by_id(
  user: TokenUser,
  Extension(context): Extension<Context>,
  Path(id): Path<String>,
) -> Result<Json<PublicWebhook>, Error> {
  let webhook_id = to_object_id(id)?;

  let webhook = context
    .models
    .webhook
    .find_one(doc! { "_id": webhook_id, "user": &user.id }, None)
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

async fn remove_webhook_by_id(
  user: TokenUser,
  Extension(context): Extension<Context>,
  Path(id): Path<String>,
) -> Result<(), Error> {
  let webhook_id = to_object_id(id)?;
  let delete_result = context
    .models
    .webhook
    .delete_one(doc! { "_id": webhook_id, "user": &user.id })
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
  title: Option<String>,
}
