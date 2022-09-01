use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct RequestQuery {
  pub from: Option<String>,
  pub offset: Option<u64>,
  pub limit: Option<u64>,
}
