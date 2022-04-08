pub mod application;
pub mod feed;
pub mod subscription;
pub mod user;
pub mod webhook;

use axum::Router;

pub fn create_router() -> Router {
  Router::new()
    .merge(user::create_router())
    .merge(feed::create_router())
    .merge(
      Router::new().nest(
        "/applications",
        Router::new().merge(application::create_router()).merge(
          Router::new().nest(
            "/:application_id",
            Router::new()
              .merge(subscription::create_router())
              .merge(webhook::create_router()),
          ),
        ),
      ),
    )
}
