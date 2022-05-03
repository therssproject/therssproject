use crate::Models;
use crate::Settings;

#[derive(Clone)]
pub struct Context {
  pub models: Models,
  pub settings: Settings,
}

impl Context {
  pub fn new(settings: Settings, models: Models) -> Self {
    Self { models, settings }
  }
}
