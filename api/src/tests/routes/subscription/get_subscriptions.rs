use reqwest;
use reqwest::StatusCode;
use serde_json::json;

use crate::models::subscription::PublicSubscription;
use crate::models::subscription::Subscription;
use crate::tests::setup::with_app;
use crate::tests::utils::create_feed;
use crate::tests::utils::create_user;
use crate::tests::utils::create_user_token;
use crate::tests::utils::setup_application;
use crate::utils::database_model::ModelExt;

#[test]
fn get_subscriptions_with_no_authentication_header() {
  let subscription_url = "https://www.reddit.com/r/rust/.rss";

  with_app(async move {
    let user = create_user("nicolas@test.com").await.unwrap();
    let (application, _, endpoint) = setup_application(&user.id.unwrap()).await.unwrap();
    let feed = create_feed().await.unwrap();

    let application_id = application.id.unwrap().clone();
    let endpoint_id = endpoint.id.unwrap().clone();
    let feed_id = feed.id.unwrap().clone();

    let subscription = Subscription::new(
      application_id.clone(),
      feed_id.clone(),
      endpoint_id.clone(),
      subscription_url.to_string(),
      None,
    );
    Subscription::create(subscription).await.unwrap();

    let client = reqwest::Client::new();
    let res = client
      .get(format!(
        "http://localhost:8088/applications/{}/subscriptions",
        application_id
      ))
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
fn get_subscriptions_with_invalid_authentication_header() {
  let subscription_url = "https://www.reddit.com/r/rust/.rss";

  with_app(async move {
    let user = create_user("nicolas@test.com").await.unwrap();
    let (application, _, endpoint) = setup_application(&user.id.unwrap()).await.unwrap();
    let feed = create_feed().await.unwrap();

    let application_id = application.id.unwrap().clone();
    let endpoint_id = endpoint.id.unwrap().clone();
    let feed_id = feed.id.unwrap().clone();

    let subscription = Subscription::new(
      application_id.clone(),
      feed_id.clone(),
      endpoint_id.clone(),
      subscription_url.to_string(),
      None,
    );
    Subscription::create(subscription).await.unwrap();

    let invalid_authentication_header = "Bearer Foo";

    let client = reqwest::Client::new();
    let res = client
      .get(format!(
        "http://localhost:8088/applications/{}/subscriptions",
        application_id
      ))
      .header("Authorization", invalid_authentication_header)
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
fn get_subscriptions_with_valid_authentication_header() {
  let subscription_url = "https://www.reddit.com/r/rust/.rss";

  with_app(async move {
    let user = create_user("nicolas@test.com").await.unwrap();
    let token = create_user_token(user.clone()).await.unwrap();
    let (application, _, endpoint) = setup_application(&user.id.unwrap()).await.unwrap();
    let feed = create_feed().await.unwrap();

    let application_id = application.id.unwrap().clone();
    let endpoint_id = endpoint.id.unwrap().clone();
    let feed_id = feed.id.unwrap().clone();

    let subscription = Subscription::new(
      application_id.clone(),
      feed_id.clone(),
      endpoint_id.clone(),
      subscription_url.to_string(),
      Some(json!({ "foo": "baz"})),
    );
    let subscription = Subscription::create(subscription).await.unwrap();
    let subscription_id = subscription.id.unwrap().clone();

    let client = reqwest::Client::new();
    let res = client
      .get(format!(
        "http://localhost:8088/applications/{}/subscriptions",
        application_id
      ))
      .header("Authorization", format!("Bearer {}", token))
      .send()
      .await
      .unwrap();

    // Status code:
    let status_code = res.status();
    let actual = status_code;
    let expected = StatusCode::OK;
    assert_eq!(actual, expected);

    // Response headers:
    let headers = res.headers();
    assert_eq!(headers.get("Content-Type").unwrap(), "application/json");
    // Response pagination headers:
    assert_eq!(headers.get("X-Pagination-Count").unwrap(), "1");
    assert_eq!(headers.get("X-Pagination-Offset").unwrap(), "0");
    assert_eq!(headers.get("X-Pagination-Limit").unwrap(), "50");

    // Response body:
    let body = res.json::<Vec<PublicSubscription>>().await.unwrap();
    assert_eq!(body.len(), 1);

    // Subscription:
    let subscription = body.get(0).unwrap();
    assert_eq!(subscription.id, subscription_id);
  });
}
