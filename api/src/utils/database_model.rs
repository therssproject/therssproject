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

use crate::database;
use crate::errors::BadRequest;
use crate::errors::Error;

// This is the Model trait. All models that have a MongoDB collection should
// implement this and therefore inherit theses methods.
#[async_trait]
pub trait ModelExt {
  type T: WitherModel + Send + Validate;

  async fn create(mut model: Self::T) -> Result<Self::T, Error> {
    model
      .validate()
      .map_err(|_error| Error::BadRequest(BadRequest::empty()))?;

    let connection = database::get_connection();
    model.save(connection, None).await.map_err(Error::Wither)?;

    Ok(model)
  }

  fn collection() -> Collection<Self::T> {
    let connection = database::get_connection();
    Self::T::collection(connection)
  }

  async fn find_by_id(id: &ObjectId) -> Result<Option<Self::T>, Error> {
    let connection = database::get_connection();
    Self::T::find_one(connection, doc! { "_id": id }, None)
      .await
      .map_err(Error::Wither)
  }

  async fn find_one(
    query: Document,
    options: Option<FindOneOptions>,
  ) -> Result<Option<Self::T>, Error> {
    let connection = database::get_connection();
    Self::T::find_one(connection, query, options)
      .await
      .map_err(Error::Wither)
  }

  async fn find<O>(query: Document, options: O) -> Result<Vec<Self::T>, Error>
  where
    O: Into<Option<FindOptions>> + Send,
  {
    let connection = database::get_connection();
    Self::T::find(connection, query, options.into())
      .await
      .map_err(Error::Wither)?
      .try_collect::<Vec<Self::T>>()
      .await
      .map_err(Error::Wither)
  }

  async fn find_and_count<O>(query: Document, options: O) -> Result<(Vec<Self::T>, u64), Error>
  where
    O: Into<Option<FindOptions>> + Send,
  {
    let connection = database::get_connection();

    // TODO: Count and find in parallel.
    let count = Self::T::collection(connection)
      .count_documents(query.clone(), None)
      .await
      .map_err(Error::Mongo)?;

    let items = Self::T::find(connection, query, options.into())
      .await
      .map_err(Error::Wither)?
      .try_collect::<Vec<Self::T>>()
      .await
      .map_err(Error::Wither)?;

    Ok((items, count))
  }

  async fn cursor(
    query: Document,
    options: Option<FindOptions>,
  ) -> Result<ModelCursor<Self::T>, Error> {
    let connection = database::get_connection();
    Self::T::find(connection, query, options)
      .await
      .map_err(Error::Wither)
  }

  async fn find_one_and_update(
    query: Document,
    update: Document,
  ) -> Result<Option<Self::T>, Error> {
    let connection = database::get_connection();

    let options = FindOneAndUpdateOptions::builder()
      .return_document(ReturnDocument::After)
      .build();

    Self::T::find_one_and_update(connection, query, update, options)
      .await
      .map_err(Error::Wither)
  }

  async fn update_one(
    query: Document,
    update: Document,
    options: Option<UpdateOptions>,
  ) -> Result<UpdateResult, Error> {
    let connection = database::get_connection();
    Self::T::collection(connection)
      .update_one(query, update, options)
      .await
      .map_err(Error::Mongo)
  }

  async fn update_many(
    query: Document,
    update: Document,
    options: Option<UpdateOptions>,
  ) -> Result<UpdateResult, Error> {
    let connection = database::get_connection();
    Self::T::collection(connection)
      .update_many(query, update, options)
      .await
      .map_err(Error::Mongo)
  }

  async fn delete_many(query: Document) -> Result<DeleteResult, Error> {
    let connection = database::get_connection();
    Self::T::delete_many(connection, query, None)
      .await
      .map_err(Error::Wither)
  }

  async fn delete_one(query: Document) -> Result<DeleteResult, Error> {
    let connection = database::get_connection();
    Self::T::collection(connection)
      .delete_one(query, None)
      .await
      .map_err(Error::Mongo)
  }

  async fn count(query: Document) -> Result<u64, Error> {
    let connection = database::get_connection();
    Self::T::collection(connection)
      .count_documents(query, None)
      .await
      .map_err(Error::Mongo)
  }

  async fn exists(query: Document) -> Result<bool, Error> {
    let connection = database::get_connection();
    let count = Self::T::collection(connection)
      .count_documents(query, None)
      .await
      .map_err(Error::Mongo)?;

    Ok(count > 0)
  }

  async fn insert_many(
    documents: Vec<Self::T>,
    options: Option<InsertManyOptions>,
  ) -> Result<InsertManyResult, Error> {
    let connection = database::get_connection();
    Self::T::collection(connection)
      .insert_many(documents, options)
      .await
      .map_err(Error::Mongo)
  }

  async fn aggregate<A>(pipeline: Vec<Document>) -> Result<Vec<A>, Error>
  where
    A: Serialize + DeserializeOwned,
  {
    let connection = database::get_connection();
    let documents = Self::T::collection(connection)
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

  async fn sync_indexes() -> Result<(), Error> {
    let connection = database::get_connection();
    Self::T::sync(connection).await.map_err(Error::Wither)?;

    Ok(())
  }
}
