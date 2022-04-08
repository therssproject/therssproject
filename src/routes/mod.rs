pub mod application;
pub mod feed;
pub mod subscription;
pub mod user;
pub mod webhook;

use axum::Router;

pub fn create() -> Router {
  Router::new()
    .merge(user::create_route())
    .merge(feed::create_route())
    .merge(
      Router::new().nest(
        "/application/:application_id",
        Router::new()
          .merge(application::create_route())
          .merge(subscription::create_route())
          .merge(webhook::create_route()),
      ),
    )
}
