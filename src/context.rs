use crate::database::Database;
use crate::messenger::Messenger;
use crate::models::entry::Model as EntryModel;
use crate::models::feed::Model as FeedModel;
use crate::models::subscription::Model as SubscriptionModel;
use crate::models::user::Model as UserModel;
use crate::models::webhook::Model as WebhookModel;
use crate::settings::Settings;

#[derive(Clone)]
pub struct Context {
  pub models: Models,
  pub settings: Settings,
}

impl Context {
  pub async fn setup(settings: Settings, db: Database, messenger: Messenger) -> Self {
    let user = UserModel::new(db.clone());
    let subscription = SubscriptionModel::setup(db.clone(), messenger.clone()).await;
    let feed = FeedModel::new(db.clone());
    let entry = EntryModel::new(db.clone());
    let webhook = WebhookModel::new(db);

    let models = Models {
      user,
      subscription,
      feed,
      entry,
      webhook,
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
  pub webhook: WebhookModel,
}
