use axum::{
  http::header::{self, HeaderName, HeaderValue},
  http::StatusCode,
  response::{IntoResponse, Response},
};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct PaginatedResponse<T: Send> {
  pub body: T,
  pub count: i64,
  pub offset: i64,
  pub limit: i64,
}

impl<T: Send> IntoResponse for PaginatedResponse<T>
where
  T: Serialize,
{
  fn into_response(self) -> Response {
    let count = self.count.to_string();
    let offset = self.offset.to_string();
    let limit = self.limit.to_string();

    match serde_json::to_vec(&self.body) {
      Ok(bytes) => (
        [
          (
            header::CONTENT_TYPE,
            HeaderValue::from_static(mime::APPLICATION_JSON.as_ref()),
          ),
          (
            HeaderName::from_static("X-Pagination-Count"),
            HeaderValue::from_str(&count).unwrap(),
          ),
          (
            HeaderName::from_static("X-Pagination-offset"),
            HeaderValue::from_str(&offset).unwrap(),
          ),
          (
            HeaderName::from_static("X-Pagination-Limit"),
            HeaderValue::from_str(&limit).unwrap(),
          ),
        ],
        bytes,
      )
        .into_response(),
      Err(err) => (
        StatusCode::INTERNAL_SERVER_ERROR,
        [(
          header::CONTENT_TYPE,
          header::HeaderValue::from_static(mime::TEXT_PLAIN_UTF_8.as_ref()),
        )],
        err.to_string(),
      )
        .into_response(),
    }
  }
}
