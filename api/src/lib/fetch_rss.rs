use feed_rs::model::Feed;
use feed_rs::parser;
use reqwest;

pub async fn fetch_rss(url: String) -> Feed {
  let content = reqwest::get(url)
    .await
    .expect("failed to fetch rss feed")
    .bytes()
    .await
    .expect("failed to decode body");

  parser::parse(content.as_ref()).expect("failed to parse rss feed")
}
