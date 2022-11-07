use feed_rs::model::Feed;
use feed_rs::parser;
use lazy_static::lazy_static;
use parser::ParseFeedError;
use reqwest;
use reqwest::Error as ReqwestError;
use std::time::Duration;

#[cfg(test)]
use mockito;

lazy_static! {
  static ref CLIENT: reqwest::Client = reqwest::Client::builder()
    .timeout(Duration::from_secs(5))
    .build()
    .expect("Failed to create a reqwest client");
}

#[derive(thiserror::Error, Debug)]
#[error("...")]
pub enum Error {
  #[error("{0}")]
  Request(#[from] ReqwestError),

  #[error("{0}")]
  Parse(#[from] ParseFeedError),
}

pub async fn get_feed(url: String) -> Result<Feed, Error> {
  let url = get_url(url);
  let content = CLIENT.get(&url).send().await?.bytes().await?;
  let feed = parser::parse(content.as_ref())?;

  Ok(feed)
}

fn get_url(url: String) -> String {
  #[cfg(test)]
  let url = mockito::server_url();

  url
}
