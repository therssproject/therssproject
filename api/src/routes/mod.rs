pub mod application;
pub mod endpoint;
pub mod feed;
pub mod key;
pub mod subscription;
pub mod user;
pub mod webhook;

use axum::middleware::from_extractor;
use axum::Router;

use crate::authentication::application::AuthenticateApplication;
use crate::authentication::key::AuthenticateKey;
use crate::authentication::user::AuthenticateUser;

pub fn create_router() -> Router {
  Router::new()
    // User routes, no authentication required.
    .merge(user::create_router())
    // Public API routes using API Keys to authenticate the User and
    // Application.
    .merge(
      Router::new()
        .merge(feed::create_router())
        .merge(subscription::create_router())
        .route_layer(from_extractor::<AuthenticateKey>()),
    )
    // Private API routes using JWT tokens to authenticate the User. These
    // routes are used from the dashboard. All these routes are scoped by an
    // application ID.
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
                  .merge(endpoint::create_router())
                  .merge(webhook::create_router())
                  .merge(key::create_router()),
              )
              // Authorize the user before allowing access to the application
              // routes.
              .route_layer(from_extractor::<AuthenticateApplication>()),
            // TODO: Create middleware to make sure the user has access to the
            // application that is querying. The above middleware is only
            // checking that the application exists.
          ),
        )
        // Authenticate the user before allowing access to the application
        // routes.
        .route_layer(from_extractor::<AuthenticateUser>()),
    )
}
