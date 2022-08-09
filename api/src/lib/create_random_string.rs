use rand::Rng;

pub fn create_random_string(size: usize) -> String {
  rand::thread_rng()
    .sample_iter(&rand::distributions::Alphanumeric)
    .take(size)
    .map(char::from)
    .collect()
}
