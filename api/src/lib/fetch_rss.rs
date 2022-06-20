use feed_rs::model::Feed;
use feed_rs::parser;
use lazy_static::lazy_static;
use reqwest;
use std::time::Duration;

#[cfg(test)]
use mockito;

lazy_static! {
  static ref CLIENT: reqwest::Client = reqwest::Client::builder()
    .timeout(Duration::from_secs(5))
    .build()
    .expect("Failed to create a reqwest client");
}

// TODO: Return a proper error type.
pub async fn get_feed(url: String) -> Result<Feed, String> {
  let url = get_url(url);
  let content = CLIENT
    .get(&url)
    .send()
    .await
    .map_err(|err| format!("Failed to request {}. Error: {}", &url, err))?
    .bytes()
    .await
    .map_err(|err| format!("Failed to decode bytes {}. Error: {}", &url, err))?;

  let feed = parser::parse(content.as_ref())
    .map_err(|err| format!("Failed to parse feed from URL {}. Error: {}", &url, err))?;

  Ok(feed)
}

fn get_url(url: String) -> String {
  #[cfg(test)]
  let url = mockito::server_url();

  url
}
