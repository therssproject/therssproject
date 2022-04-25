pub mod application;
pub mod feed;
pub mod subscription;
pub mod user;
pub mod webhook;

use axum::extract::extractor_middleware;
use axum::Router;

use crate::lib::token::UserFromToken;
use crate::models::application::Application;

pub fn create_router() -> Router {
  Router::new()
    .merge(user::create_router())
    .merge(feed::create_router())
    .merge(
      Router::new()
        .nest(
          "/applications",
          Router::new().merge(application::create_router()).merge(
            Router::new()
              .nest(
                "/:application_id",
                Router::new()
                  .merge(subscription::create_router())
                  .merge(webhook::create_router()),
              )
              // Authorize the user before allowing access to the application
              // routes.
              .route_layer(extractor_middleware::<Application>()),
            // TODO: Create middleware to make sure the user has access to the
            // application that is querying. The above middleware is only
            // checking that the application exists.
          ),
        )
        // Authenticate the user before allowing access to the application
        // routes.
        .route_layer(extractor_middleware::<UserFromToken>()),
    )
}
