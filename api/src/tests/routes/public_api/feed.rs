use bson::doc;
use lazy_static::lazy_static;
use mockito::mock;
use reqwest;
use reqwest::StatusCode;

use crate::routes::feed::FeedResponse;
use crate::tests::setup::with_app;
use crate::tests::utils::create_user;
use crate::tests::utils::setup_application;

lazy_static! {
  static ref FIXTURE: &'static str = include_str!("../../fixture/reddit_atom.xml");
}

#[test]
fn get_feeds_with_no_authentication_header() {
  let feed_url = "https://www.reddit.com/r/rust/.rss";

  with_app(async move {
    let client = reqwest::Client::new();
    let res = client
      .get("http://localhost:8088/v1/feeds")
      .query(&[("url", feed_url)])
      .send()
      .await
      .unwrap();

    // Status code:
    let status_code = res.status();
    let actual = status_code;
    let expected = StatusCode::UNAUTHORIZED;
    assert_eq!(actual, expected);
  });
}

#[test]
fn get_feeds_with_invalid_authentication_header() {
  let feed_url = "https://www.reddit.com/r/rust/.rss";

  with_app(async move {
    let invalid_authentication_header = "Foo";

    let client = reqwest::Client::new();
    let res = client
      .get("http://localhost:8088/v1/feeds")
      .header("Authorization", invalid_authentication_header)
      .query(&[("url", feed_url)])
      .send()
      .await
      .unwrap();

    // Status code:
    let status_code = res.status();
    let actual = status_code;
    let expected = StatusCode::UNAUTHORIZED;
    assert_eq!(actual, expected);
  });
}

#[test]
fn get_feeds_with_valid_authentication_header() {
  let feed_url = "https://www.reddit.com/r/rust/.rss";

  // TODO: At least match a path
  let request_feed_mock = mock("GET", "/")
    .with_status(200)
    .with_body(FIXTURE.clone())
    .create();

  with_app(async move {
    let user = create_user("nicolas@test.com").await.unwrap();
    let (_, key, _) = setup_application(&user.id.unwrap()).await.unwrap();

    let client = reqwest::Client::new();
    let res = client
      .get("http://localhost:8088/v1/feeds")
      .header("Authorization", key)
      .query(&[("url", feed_url)])
      .send()
      .await
      .unwrap();

    request_feed_mock.assert();

    // Status code:
    let status_code = res.status();
    let actual = status_code;
    let expected = StatusCode::OK;
    assert_eq!(actual, expected);

    // Body:
    let body = res.json::<FeedResponse>().await.unwrap();
    assert_eq!(body.entries.len(), 1);
  });
}
