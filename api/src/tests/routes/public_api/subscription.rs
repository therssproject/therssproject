use assert_json_diff::assert_json_eq;
use bson::doc;
use lazy_static::lazy_static;
use mockito::mock;
use reqwest;
use reqwest::StatusCode;
use serde_json::json;

use crate::lib::database_model::ModelExt;
use crate::models::feed::Feed;
use crate::models::subscription::PublicSubscription;
use crate::models::subscription::Subscription;
use crate::tests::setup::with_app;
use crate::tests::utils::create_user;
use crate::tests::utils::setup_application;

lazy_static! {
  static ref FIXTURE: &'static str = include_str!("../../fixture/reddit_atom.xml");
}

#[test]
fn post_subscriptions_with_no_authentication_header() {
  let subscription_url = "https://www.reddit.com/r/rust/.rss";

  with_app(async move {
    let user = create_user("nicolas@test.com").await.unwrap();
    let (_, _, endpoint) = setup_application(&user.id.unwrap()).await.unwrap();

    let body = json!({
      "url": subscription_url,
      "endpoint": endpoint.id.unwrap().clone()
    });

    let client = reqwest::Client::new();
    let res = client
      .post("http://localhost:8088/v1/subscriptions")
      .json(&body)
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
fn post_subscriptions_with_invalid_authentication_header() {
  let subscription_url = "https://www.reddit.com/r/rust/.rss";

  with_app(async move {
    let user = create_user("nicolas@test.com").await.unwrap();
    let (_, _, endpoint) = setup_application(&user.id.unwrap()).await.unwrap();

    let body = json!({
      "url": subscription_url,
      "endpoint": endpoint.id.unwrap().clone()
    });

    let invalid_authentication_header = "Foo";

    let client = reqwest::Client::new();
    let res = client
      .post("http://localhost:8088/v1/subscriptions")
      .header("Authorization", invalid_authentication_header)
      .json(&body)
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
fn post_subscriptions_with_valid_authentication_header() {
  let subscription_url = "https://www.reddit.com/r/rust/.rss";

  // TODO: At least match a path
  let request_feed_mock = mock("GET", "/")
    .with_status(200)
    .with_body(FIXTURE.clone())
    .create();

  with_app(async move {
    let user = create_user("nicolas@test.com").await.unwrap();
    let (_, key, endpoint) = setup_application(&user.id.unwrap()).await.unwrap();

    let body = json!({
      "url": subscription_url,
      "endpoint": endpoint.id.unwrap().clone().to_string(),
      "metadata": json!({"foo": "baz"})
    });

    let client = reqwest::Client::new();
    let res = client
      .post("http://localhost:8088/v1/subscriptions")
      .header("Authorization", key.key)
      .json(&body)
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
    let body = res.json::<PublicSubscription>().await.unwrap();
    assert_eq!(body.url, "https://www.reddit.com/r/rust/.rss");
    assert_json_eq!(body.metadata, json!({ "foo": "baz" }));

    // Feed from database:
    let count = Feed::count(doc! {}).await.unwrap();
    assert_eq!(count, 1, "Should have create one feed");

    // Subscription from database:
    let count = Subscription::count(doc! {}).await.unwrap();
    assert_eq!(count, 1, "Should have create one subscription");
  });
}
