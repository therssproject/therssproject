use axum::{
  http::header::{self, HeaderName, HeaderValue},
  http::StatusCode,
  response::{IntoResponse, Response},
};
use serde::Serialize;
use tracing::error;

#[derive(Serialize)]
pub struct PaginatedResponse<T> {
  pub body: T,
  pub count: i64,
  pub offset: i64,
  pub limit: i64,
}

impl<T> IntoResponse for PaginatedResponse<T>
where
  T: Serialize,
{
  fn into_response(self) -> Response {
    let bytes = match serde_json::to_vec(&self.body) {
      Ok(bytes) => bytes,
      Err(err) => {
        error!("failed to serialize paginated response: {}", err);
        return create_error_response(err);
      }
    };

    (
      [
        (
          header::CONTENT_TYPE,
          HeaderValue::from_static(mime::APPLICATION_JSON.as_ref()),
        ),
        (
          HeaderName::from_static("X-Pagination-Count"),
          to_header_value(self.count),
        ),
        (
          HeaderName::from_static("X-Pagination-offset"),
          to_header_value(self.offset),
        ),
        (
          HeaderName::from_static("X-Pagination-Limit"),
          to_header_value(self.limit),
        ),
      ],
      bytes,
    )
      .into_response()
  }
}

fn create_error_response(err: impl std::error::Error) -> Response {
  (
    StatusCode::INTERNAL_SERVER_ERROR,
    [(
      header::CONTENT_TYPE,
      header::HeaderValue::from_static(mime::TEXT_PLAIN_UTF_8.as_ref()),
    )],
    err.to_string(),
  )
    .into_response()
}

fn to_header_value(value: i64) -> HeaderValue {
  let value = value.to_string();
  HeaderValue::from_str(&value).unwrap()
}
