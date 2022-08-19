use serde::Deserialize;

#[derive(Deserialize)]
pub struct RequestQuery {
  pub from: Option<String>,
  pub offset: Option<u64>,
  pub limit: Option<u64>,
}
