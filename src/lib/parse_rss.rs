use feed_rs::model::Feed;
use feed_rs::parser;
use reqwest;

// TODO: handle errors
// TODO: rename => fetch_rss ???
pub async fn parse_rss(url: String) -> Feed {
  let content = reqwest::get(url)
    .await
    .expect("failed to fetch rss feed")
    .bytes()
    .await
    .expect("failed to decode body");

  parser::parse(content.as_ref()).expect("failed to parse rss feed")
}
