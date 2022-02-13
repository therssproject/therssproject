use crate::database::Database;

use crate::models::entry::Model as EntryModel;
use crate::models::feed::Model as FeedModel;
use crate::models::subscription::Model as SubscriptionModel;
use crate::models::user::Model as UserModel;
use crate::settings::Settings;

#[derive(Clone)]
pub struct Context {
  pub models: Models,
  pub settings: Settings,
}

impl Context {
  pub fn new(db: Database, settings: Settings) -> Self {
    let user = UserModel::new(db.clone());
    let subscription = SubscriptionModel::new(db.clone());
    let feed = FeedModel::new(db.clone());
    let entry = EntryModel::new(db);

    let models = Models {
      user,
      subscription,
      feed,
      entry,
    };

    Self { models, settings }
  }
}

#[derive(Clone)]
pub struct Models {
  pub user: UserModel,
  pub subscription: SubscriptionModel,
  pub feed: FeedModel,
  pub entry: EntryModel,
}
