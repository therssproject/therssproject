export const registerEndpoint = [
  'curl https://api.therssproject.com/v1/endpoints ',
  '-H "Authorization: <api-key>" ',
  `-d '{"title": "My endpoint", "url": "https://myserver.com/webhooks/rss"}'`,
].join('\\\n');

export const createSubscription = [
  'curl https://api.therssproject.com/v1/subscriptions ',
  '-H "Authorization: <api-key>" ',
  `-d '{"endpoint": "asdf-1234-ghjk-5678", "url": "https://www.reddit.com/r/Dotat2/.rss"}'`,
].join('\\\n');
