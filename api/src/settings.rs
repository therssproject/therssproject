use config::{Config, ConfigError, Environment, File};
use serde::Deserialize;
use std::{env, fmt};

// The Rust compiler is allowed to assume that the value a shared reference
// points to will not change while that reference lives. In this case, settings
// is a singleton that is only changed once by the main thread.

static mut SETTINGS: Option<Settings> = None;

#[derive(Debug, Clone, Deserialize)]
pub struct Server {
  pub port: u16,
}

#[derive(Debug, Clone, Deserialize)]
pub struct Logger {
  pub level: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct Database {
  pub uri: String,
  pub name: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct Auth {
  pub secret: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct Rabbitmq {
  pub uri: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct Settings {
  pub environment: String,
  pub server: Server,
  pub logger: Logger,
  pub database: Database,
  pub rabbitmq: Rabbitmq,
  pub auth: Auth,
}

impl Settings {
  fn new() -> Result<Self, ConfigError> {
    let run_mode = env::var("RUN_MODE").unwrap_or_else(|_| "development".into());

    let mut builder = Config::builder()
      .add_source(File::with_name("api/config/default"))
      .add_source(File::with_name(&format!("api/config/{}", run_mode)).required(false))
      .add_source(File::with_name("api/config/local").required(false))
      .add_source(Environment::default().separator("__"));

    // Some cloud services like Heroku exposes a randomly assigned port in
    // the PORT env var and there is no way to change the env var name.
    if let Ok(port) = env::var("PORT") {
      builder = builder.set_override("server.port", port)?;
    }

    builder
      .build()?
      // Deserialize (and thus freeze) the entire configuration.
      .try_deserialize()
  }
}

impl fmt::Display for Server {
  fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
    write!(f, "http://localhost:{}", &self.port)
  }
}

pub fn setup() -> Result<&'static Settings, ConfigError> {
  unsafe {
    if SETTINGS.is_some() {
      panic!("Settings already initialized");
    }
  };

  let settings = Settings::new()?;
  unsafe {
    SETTINGS = Some(settings);
    Ok(SETTINGS.as_ref().unwrap())
  }
}

pub fn get_settings() -> &'static Settings {
  unsafe { SETTINGS.as_ref().expect("Settings not initialized") }
}
