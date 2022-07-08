use bson::doc;
use reqwest;
use reqwest::StatusCode;
use serde::{Deserialize, Serialize};

use crate::lib::database_model::ModelExt;
use crate::models::application::Application;
use crate::models::user::PublicUser;
use crate::models::user::User;
use crate::routes::user::AuthenticateResponse;
use crate::tests::setup::with_app;
use crate::tests::utils::create_user;

#[test]
fn post_user_route() {
  #[derive(Debug, Serialize, Deserialize)]
  struct Body {
    name: String,
    email: String,
    password: String,
  }

  let body = Body {
    name: "Nahuel".to_owned(),
    email: "nahuel@test.com".to_owned(),
    password: "Password1".to_owned(),
  };

  with_app(async move {
    let client = reqwest::Client::new();
    let res = client
      .post("http://localhost:8088/users")
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
    let body = res.json::<PublicUser>().await.unwrap();
    assert_eq!(body.name, "Nahuel");
    assert_eq!(body.email, "nahuel@test.com");

    // User from database:
    let user = User::find_one(doc! {}, None).await.unwrap().unwrap();
    assert_eq!(user.name, "Nahuel");
    assert_eq!(user.email, "nahuel@test.com");

    // Application:
    let application = Application::find_one(doc! {}, None).await.unwrap().unwrap();
    assert_eq!(application.owner, user.id.unwrap());
    assert_eq!(application.name, "Nahuel");
  });
}

#[test]
fn authenticate_user_route() {
  #[derive(Debug, Serialize, Deserialize)]
  struct RequestBody {
    email: String,
    password: String,
  }

  let request_body = RequestBody {
    email: "nahuel@test.com".to_owned(),
    password: "Password1".to_owned(),
  };

  with_app(async move {
    create_user("nahuel@test.com").await.unwrap();

    let client = reqwest::Client::new();
    let res = client
      .post("http://localhost:8088/users/authenticate")
      .json(&request_body)
      .send()
      .await
      .unwrap();

    // Status code:
    let status_code = res.status();
    let actual = status_code;
    let expected = StatusCode::OK;
    assert_eq!(actual, expected);

    // Body:
    let body = res.json::<AuthenticateResponse>().await.unwrap();
    assert_eq!(body.user.email, "nahuel@test.com");
  });
}
