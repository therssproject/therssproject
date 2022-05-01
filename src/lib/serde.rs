use bson::DateTime;
use serde::Serializer;

pub fn bson_datetime_option_as_rfc3339_string<S: Serializer>(
  date: &Option<DateTime>,
  serializer: S,
) -> Result<S::Ok, S::Error> {
  match *date {
    Some(date) => {
      let rfc3339_string = date.to_rfc3339_string();
      serializer.serialize_str(&rfc3339_string)
    }
    None => serializer.serialize_none(),
  }
}
