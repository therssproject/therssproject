// TODO: Move this logic and token logic to a separate authentication file.
use axum::{
  async_trait,
  extract::{Extension, FromRequest, RequestParts, TypedHeader},
  headers::{authorization::Bearer, Authorization},
};

use crate::context::Context;
use crate::errors::AuthenticateError;
use crate::errors::Error;
use crate::lib::token;
use crate::lib::token::UserFromToken;

#[async_trait]
impl<B> FromRequest<B> for UserFromToken
where
  B: Send,
{
  type Rejection = Error;

  async fn from_request(req: &mut RequestParts<B>) -> Result<Self, Self::Rejection> {
    let TypedHeader(Authorization(bearer)) =
      TypedHeader::<Authorization<Bearer>>::from_request(req)
        .await
        .map_err(|_| AuthenticateError::InvalidToken)?;

    let Extension(context): Extension<Context> = Extension::from_request(req)
      .await
      .map_err(|_| Error::ReadContext)?;

    let secret = context.settings.auth.secret.as_str();
    let token_data =
      token::decode(bearer.token(), secret).map_err(|_| AuthenticateError::InvalidToken)?;

    let user = token_data.claims.user;

    // Store the user from token in the request extensions to allow accessing it
    // from other middlewares.
    req.extensions_mut().insert(user.clone());

    Ok(user)
  }
}
