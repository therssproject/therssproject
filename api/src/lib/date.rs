use chrono::DateTime;
use chrono::ParseError;
use chrono::Utc;

pub type Date = bson::DateTime;

pub fn now() -> Date {
  Utc::now().into()
}

pub fn from_iso(iso: &str) -> Result<DateTime<Utc>, ParseError> {
  let date = chrono::DateTime::parse_from_rfc3339(iso)?.with_timezone(&Utc);
  Ok(date)
}
