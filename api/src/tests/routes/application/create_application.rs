use bson::doc;
use reqwest;
use reqwest::StatusCode;
use serde_json::json;

use crate::lib::database_model::ModelExt;
use crate::models::application::Application;
use crate::models::application::PublicApplication;
use crate::tests::setup::with_app;
use crate::tests::utils::create_user;
use crate::tests::utils::create_user_token;

#[test]
fn create_application_with_valid_authentication_header() {
  with_app(async move {
    let user = create_user("nicolas@test.com").await.unwrap();
    let token = create_user_token(user.clone()).await.unwrap();

    let body = json!({
      "name": "The test application",
      "description": "The test application description",
    });

    let client = reqwest::Client::new();
    let res = client
      .post(format!("http://localhost:8088/applications",))
      .header("Authorization", format!("Bearer {}", token))
      .json(&body)
      .send()
      .await
      .unwrap();

    // Status code:
    let status_code = res.status();
    let actual = status_code;
    let expected = StatusCode::OK;
    assert_eq!(actual, expected);

    // Body:
    let body = res.json::<PublicApplication>().await.unwrap();
    assert_eq!(body.name, "The test application");
    assert_eq!(
      body.description,
      Some(String::from("The test application description"))
    );

    // Application from database:
    let count = Application::count(doc! {}).await.unwrap();
    assert_eq!(count, 1, "Should have create one application");
  });
}
