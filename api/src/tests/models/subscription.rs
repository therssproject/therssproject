use bson::doc;
use bson::oid::ObjectId;
use bson::Document;

use crate::database::get_connection;
use crate::lib::database_model::ModelExt;
use crate::models::subscription::Subscription;
use crate::tests::setup::with_app;

#[test]
fn when_creating_a_subscription_scheduled_at_should_not_be_defined_on_the_database() {
  with_app(async move {
    let application_id = ObjectId::new();
    let feed_id = ObjectId::new();
    let endpoint_id = ObjectId::new();
    let url = "http://example.com/".to_string();
    let metadata = None;

    let subscription = Subscription::new(application_id, feed_id, endpoint_id, url, metadata);
    let subscription = Subscription::create(subscription).await.unwrap();
    let subscription_id = subscription.id.unwrap();

    // Subscription from database
    let connection = get_connection();
    let collection = connection.collection::<Document>("subscriptions");
    let subscription = collection
      .find_one(doc! { "_id": &subscription_id }, None)
      .await
      .unwrap()
      .unwrap();
    assert_eq!(subscription.get("scheduled_at"), None);
  });
}
