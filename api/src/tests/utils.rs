use wither::bson::oid::ObjectId;

use crate::errors::Error;
use crate::lib::database_model::ModelExt;
use crate::lib::date;
use crate::lib::token;
use crate::models::application::Application;
use crate::models::endpoint::Endpoint;
use crate::models::feed::{Feed, FeedType};
use crate::models::key::Key;
use crate::models::user::hash_password;
use crate::models::user::User;
use crate::settings::get_settings;

pub async fn create_user<T: AsRef<str>>(email: T) -> Result<User, Error> {
  let name = "John Doe";
  let password = "Password1";

  let password_hash = hash_password(password).await?;
  let user = User::new(name, email.as_ref(), password_hash);
  let user = User::create(user).await?;

  Ok(user)
}

pub async fn create_user_token(user: User) -> Result<String, Error> {
  let settings = get_settings();
  let secret = settings.auth.secret.as_str();
  let token = token::create(user, secret).unwrap();

  Ok(token)
}

pub async fn create_application(user: &ObjectId) -> Result<Application, Error> {
  let name = "Test Application";
  let desciption = "This is an application for E2E tests";

  let application = Application::new(user.clone(), name, Some(desciption));
  let application = Application::create(application).await?;

  Ok(application)
}

pub async fn setup_application(user: &ObjectId) -> Result<(Application, Key, Endpoint), Error> {
  let application = create_application(user).await?;

  let url = "http://localhost:8080/endpoint";
  let title = "Test Endpoint";
  let endpoint = Endpoint::new(application.id.clone().unwrap(), url, title);
  let endpoint = Endpoint::create(endpoint).await?;

  let title = "Test Key";
  let key = Key::new(application.id.unwrap().clone(), title);
  let key = Key::create(key).await?;

  Ok((application, key, endpoint))
}

pub async fn create_feed() -> Result<Feed, Error> {
  let now = date::now();
  let feed = Feed {
    id: None,
    public_id: "PUBLIC_ID_FOO".to_string(),
    feed_type: FeedType::RSS2,
    url: "https://www.reddit.com/r/rust/.rss".to_string(),
    title: Some("The Rust Programming Language".to_string()),
    description: Some("The official subreddit for the Rust programming language".to_string()),
    synced_at: now,
    updated_at: now,
    created_at: now,
  };

  let feed = Feed::create(feed).await?;
  Ok(feed)
}
