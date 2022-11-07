use sha2::{Digest, Sha256};

pub fn sha256<T: AsRef<str>>(value: T) -> String {
  let mut hasher = Sha256::new();
  hasher.update(value.as_ref());
  format!("{:X}", hasher.finalize())
}
