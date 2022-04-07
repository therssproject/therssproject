use url::Url;

use crate::errors::Error;

pub fn to_url<S: AsRef<str>>(url: S) -> Result<Url, Error> {
  let url = url.as_ref();
  let url = Url::parse(url).map_err(|_| Error::ParseURL)?;
  Ok(url)
}
