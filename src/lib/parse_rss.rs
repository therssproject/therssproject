use feed_rs::parser;
use reqwest;

pub async fn parse_rss(url: String) {
  let content = reqwest::get(url).await.unwrap().bytes().await.unwrap();

  let feed = parser::parse(content.as_ref()).unwrap();
  println!("Feed {:#?}", feed);
}
