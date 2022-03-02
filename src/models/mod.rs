pub mod entry;
pub mod event;
pub mod feed;
pub mod subscription;
pub mod user;
pub mod webhook;

use async_trait::async_trait;
use futures::stream::TryStreamExt;
use serde::{de::DeserializeOwned, ser::Serialize};
use validator::Validate;
use wither::bson::doc;
use wither::bson::from_bson;
use wither::bson::Bson;
use wither::bson::Document;
use wither::bson::{self, oid::ObjectId};
use wither::mongodb::options::FindOneAndUpdateOptions;
use wither::mongodb::options::FindOneOptions;
use wither::mongodb::options::FindOptions;
use wither::mongodb::options::InsertManyOptions;
use wither::mongodb::options::ReturnDocument;
use wither::mongodb::options::UpdateOptions;
use wither::mongodb::results::DeleteResult;
use wither::mongodb::results::InsertManyResult;
use wither::mongodb::results::UpdateResult;
use wither::mongodb::Collection;
use wither::Model as WitherModel;
use wither::ModelCursor;

use crate::database::Database;
use crate::errors::BadRequest;
use crate::errors::Error;

// This is the Model trait. All models that have a MongoDB collection should
// implement this and therefore inherit theses methods.
#[async_trait]
pub trait ModelExt {
  type T: WitherModel + Send + Validate;

  fn get_database(&self) -> &Database;

  async fn create(&self, mut model: Self::T) -> Result<Self::T, Error> {
    model
      .validate()
      .map_err(|_error| Error::BadRequest(BadRequest::empty()))?;

    let db = self.get_database();
    model.save(&db.conn, None).await.map_err(Error::Wither)?;

    Ok(model)
  }

  async fn collection(&self) -> Collection<Self::T> {
    let db = self.get_database();
    Self::T::collection(&db.conn)
  }

  async fn find_by_id(&self, id: &ObjectId) -> Result<Option<Self::T>, Error> {
    let db = self.get_database();
    Self::T::find_one(&db.conn, doc! { "_id": id }, None)
      .await
      .map_err(Error::Wither)
  }

  async fn find_one(
    &self,
    query: Document,
    options: Option<FindOneOptions>,
  ) -> Result<Option<Self::T>, Error> {
    let db = self.get_database();
    Self::T::find_one(&db.conn, query, options)
      .await
      .map_err(Error::Wither)
  }

  async fn find<O>(&self, query: Document, options: O) -> Result<Vec<Self::T>, Error>
  where
    O: Into<Option<FindOptions>> + Send,
  {
    let db = self.get_database();
    Self::T::find(&db.conn, query, options.into())
      .await
      .map_err(Error::Wither)?
      .try_collect::<Vec<Self::T>>()
      .await
      .map_err(Error::Wither)
  }

  async fn cursor(
    &self,
    query: Document,
    options: Option<FindOptions>,
  ) -> Result<ModelCursor<Self::T>, Error> {
    let db = self.get_database();
    Self::T::find(&db.conn, query, options)
      .await
      .map_err(Error::Wither)
  }

  async fn find_one_and_update(
    &self,
    query: Document,
    update: Document,
  ) -> Result<Option<Self::T>, Error> {
    let db = self.get_database();

    let options = FindOneAndUpdateOptions::builder()
      .return_document(ReturnDocument::After)
      .build();

    Self::T::find_one_and_update(&db.conn, query, update, options)
      .await
      .map_err(Error::Wither)
  }

  async fn update_one(
    &self,
    query: Document,
    update: Document,
    options: Option<UpdateOptions>,
  ) -> Result<UpdateResult, Error> {
    let db = self.get_database();
    Self::T::collection(&db.conn)
      .update_one(query, update, options)
      .await
      .map_err(Error::Mongo)
  }

  async fn update_many(
    &self,
    query: Document,
    update: Document,
    options: Option<UpdateOptions>,
  ) -> Result<UpdateResult, Error> {
    let db = self.get_database();
    Self::T::collection(&db.conn)
      .update_many(query, update, options)
      .await
      .map_err(Error::Mongo)
  }

  async fn delete_many(&self, query: Document) -> Result<DeleteResult, Error> {
    let db = self.get_database();
    Self::T::delete_many(&db.conn, query, None)
      .await
      .map_err(Error::Wither)
  }

  async fn delete_one(&self, query: Document) -> Result<DeleteResult, Error> {
    let db = self.get_database();
    Self::T::collection(&db.conn)
      .delete_one(query, None)
      .await
      .map_err(Error::Mongo)
  }

  async fn count(&self, query: Document) -> Result<u64, Error> {
    let db = self.get_database();
    Self::T::collection(&db.conn)
      .count_documents(query, None)
      .await
      .map_err(Error::Mongo)
  }

  async fn exists(&self, query: Document) -> Result<bool, Error> {
    let db = self.get_database();
    let count = Self::T::collection(&db.conn)
      .count_documents(query, None)
      .await
      .map_err(Error::Mongo)?;

    Ok(count > 0)
  }

  async fn insert_many(
    &self,
    documents: Vec<Self::T>,
    options: InsertManyOptions,
  ) -> Result<InsertManyResult, Error> {
    let db = self.get_database();
    Self::T::collection(&db.conn)
      .insert_many(documents, options)
      .await
      .map_err(Error::Mongo)
  }

  async fn aggregate<A>(&self, pipeline: Vec<Document>) -> Result<Vec<A>, Error>
  where
    A: Serialize + DeserializeOwned,
  {
    let db = self.get_database();
    let documents = Self::T::collection(&db.conn)
      .aggregate(pipeline, None)
      .await
      .map_err(Error::Mongo)?
      .try_collect::<Vec<Document>>()
      .await
      .map_err(Error::Mongo)?;

    let documents = documents
      .into_iter()
      .map(|document| from_bson::<A>(Bson::Document(document)))
      .collect::<Result<Vec<A>, bson::de::Error>>()
      .map_err(Error::SerializeMongoResponse)?;

    Ok(documents)
  }

  async fn sync_indexes(&self) -> Result<(), Error> {
    let db = self.get_database();
    Self::T::sync(&db.conn).await.map_err(Error::Wither)?;

    Ok(())
  }
}
