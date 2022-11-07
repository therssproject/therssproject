use bson::doc;
use futures::StreamExt;
use tracing::{error, info};

use crate::models::feed::Feed;
use crate::utils::database_model::ModelExt;

pub async fn run() {
  let feeds = Feed::cursor(doc! {}, None).await.unwrap();

  feeds
    .map(|feed| feed.unwrap())
    .for_each(|feed| async move {
      let id = feed.id.unwrap();

      info!("Cleaning up feed {}", &id);

      let result = Feed::cleanup(&id).await;
      if let Err(err) = result {
        error!("Failed to cleanup Feed {:?}. Error: {}", id, err);
      }
    })
    .await;
}
