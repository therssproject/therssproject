use chrono::Duration;
use chrono::Utc;
use reqwest;
use reqwest::StatusCode;
use serde_json::json;

use crate::lib::database_model::ModelExt;
use crate::lib::date;
use crate::models::subscription::Subscription;
use crate::models::webhook::PublicWebhook;
use crate::models::webhook::Status;
use crate::models::webhook::Webhook;
use crate::tests::setup::with_app;
use crate::tests::utils::create_feed;
use crate::tests::utils::create_user;
use crate::tests::utils::create_user_token;
use crate::tests::utils::setup_application;

pub type Date = bson::DateTime;

#[test]
fn get_webhooks_with_no_authentication_header() {
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
    let subscription = Subscription::create(subscription).await.unwrap();
    let subscription_id = subscription.id.unwrap().clone();

    let webhook = Webhook {
      id: None,
      application: application_id.clone(),
      subscription: subscription_id,
      feed: feed_id,
      endpoint: endpoint_id,
      status: Status::Sent,
      endpoint_url: endpoint.url.clone(),
      feed_url: subscription_url.to_string(),
      feed_title: Some("Rust".to_owned()),
      created_at: date::now(),
    };
    Webhook::create(webhook).await.unwrap();

    let client = reqwest::Client::new();
    let res = client
      .get(format!(
        "http://localhost:8088/applications/{}/webhooks",
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
fn get_webhooks_with_invalid_authentication_header() {
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
    let subscription = Subscription::create(subscription).await.unwrap();
    let subscription_id = subscription.id.unwrap().clone();

    let webhook = Webhook {
      id: None,
      application: application_id.clone(),
      subscription: subscription_id,
      feed: feed_id,
      endpoint: endpoint_id,
      status: Status::Sent,
      endpoint_url: endpoint.url.clone(),
      feed_url: subscription_url.to_string(),
      feed_title: Some("Rust".to_owned()),
      created_at: date::now(),
    };
    Webhook::create(webhook).await.unwrap();

    let invalid_authentication_header = "Bearer Foo";

    let client = reqwest::Client::new();
    let res = client
      .get(format!(
        "http://localhost:8088/applications/{}/webhooks",
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
fn get_webhooks_with_valid_authentication_header() {
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

    let webhook = Webhook {
      id: None,
      application: application_id.clone(),
      subscription: subscription_id,
      feed: feed_id,
      endpoint: endpoint_id,
      status: Status::Sent,
      endpoint_url: endpoint.url.clone(),
      feed_url: subscription_url.to_string(),
      feed_title: Some("Rust".to_owned()),
      created_at: date::now(),
    };
    let webhook = Webhook::create(webhook).await.unwrap();
    let webhook_id = webhook.id.unwrap().clone();

    let client = reqwest::Client::new();
    let res = client
      .get(format!(
        "http://localhost:8088/applications/{}/webhooks",
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
    let body = res.json::<Vec<PublicWebhook>>().await.unwrap();
    assert_eq!(body.len(), 1);

    // Webhook:
    let webhook = body.get(0).unwrap();
    assert_eq!(webhook.id, webhook_id);
  });
}

#[test]
fn get_webhooks_with_from_querystring_when_range_includes_only_one_webhook() {
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

    // First webhook from last week
    let last_week = Utc::now() - Duration::days(7);
    let last_week: Date = last_week.into();
    let first_webhook = Webhook {
      id: None,
      application: application_id.clone(),
      subscription: subscription_id,
      feed: feed_id,
      endpoint: endpoint_id,
      status: Status::Sent,
      endpoint_url: endpoint.url.clone(),
      feed_url: subscription_url.to_string(),
      feed_title: Some("Rust".to_owned()),
      created_at: last_week,
    };
    Webhook::create(first_webhook).await.unwrap();

    // Second webhook from today
    let second_webhook = Webhook {
      id: None,
      application: application_id.clone(),
      subscription: subscription_id,
      feed: feed_id,
      endpoint: endpoint_id,
      status: Status::Sent,
      endpoint_url: endpoint.url.clone(),
      feed_url: subscription_url.to_string(),
      feed_title: Some("Rust".to_owned()),
      created_at: date::now(),
    };
    let second_webhook = Webhook::create(second_webhook).await.unwrap();
    let second_webhook_id = second_webhook.id.unwrap().clone();

    let from = Utc::now() - Duration::days(6);
    let from = from.to_rfc3339();
    let client = reqwest::Client::new();
    let res = client
      .get(format!(
        "http://localhost:8088/applications/{}/webhooks",
        application_id
      ))
      .header("Authorization", format!("Bearer {}", token))
      .query(&[("from", from.as_str())])
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
    let body = res.json::<Vec<PublicWebhook>>().await.unwrap();
    assert_eq!(body.len(), 1);

    // Webhook:
    let webhook = body.get(0).unwrap();
    assert_eq!(webhook.id, second_webhook_id);
  });
}

#[test]
fn get_webhooks_with_from_querystring_when_range_includes_two_webhook() {
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

    // First webhook from last week
    let last_week = Utc::now() - Duration::days(7);
    let last_week: Date = last_week.into();
    let first_webhook = Webhook {
      id: None,
      application: application_id.clone(),
      subscription: subscription_id,
      feed: feed_id,
      endpoint: endpoint_id,
      status: Status::Sent,
      endpoint_url: endpoint.url.clone(),
      feed_url: subscription_url.to_string(),
      feed_title: Some("Rust".to_owned()),
      created_at: last_week,
    };
    let first_webhook = Webhook::create(first_webhook).await.unwrap();
    let first_webhook_id = first_webhook.id.clone().unwrap();

    // Second webhook from today
    let second_webhook = Webhook {
      id: None,
      application: application_id.clone(),
      subscription: subscription_id,
      feed: feed_id,
      endpoint: endpoint_id,
      status: Status::Sent,
      endpoint_url: endpoint.url.clone(),
      feed_url: subscription_url.to_string(),
      feed_title: Some("Rust".to_owned()),
      created_at: date::now(),
    };
    let second_webhook = Webhook::create(second_webhook).await.unwrap();
    let second_webhook_id = second_webhook.id.unwrap().clone();

    let from = Utc::now() - Duration::days(8);
    let from = from.to_rfc3339();
    let client = reqwest::Client::new();
    let res = client
      .get(format!(
        "http://localhost:8088/applications/{}/webhooks",
        application_id
      ))
      .header("Authorization", format!("Bearer {}", token))
      .query(&[("from", from.as_str())])
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
    assert_eq!(headers.get("X-Pagination-Count").unwrap(), "2");
    assert_eq!(headers.get("X-Pagination-Offset").unwrap(), "0");
    assert_eq!(headers.get("X-Pagination-Limit").unwrap(), "50");

    // Response body:
    let body = res.json::<Vec<PublicWebhook>>().await.unwrap();
    assert_eq!(body.len(), 2);

    // First webhook (Second webhhook on the database)::
    let webhook = body.get(0).unwrap();
    assert_eq!(webhook.id, second_webhook_id);

    // Second webhook (First webhhook on the database):
    let webhook = body.get(1).unwrap();
    assert_eq!(webhook.id, first_webhook_id);
  });
}
