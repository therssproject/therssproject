use std::env;

use crate::settings::get_settings;

pub fn setup() {
  if env::var_os("RUST_LOG").is_none() {
    let settings = get_settings();
    let level = settings.logger.level.as_str();
    let env = format!("rss={},tower_http=debug", level);

    env::set_var("RUST_LOG", env);
  }

  tracing_subscriber::fmt::init();
}
