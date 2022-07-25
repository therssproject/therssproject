const mkMultilineCmd = (lines: string[]) => lines.join(' \\\n  ');

export const registerEndpoint = mkMultilineCmd([
  'curl https://api.therssproject.com/v1/endpoints',
  '-H "Content-Type: application/json"',
  '-H "Authorization: <api-key>"',
  `-d '{"title": "My endpoint", "url": "https://myserver.com/webhooks/rss"}'`,
]);

export const createSubscription = mkMultilineCmd([
  'curl https://api.therssproject.com/v1/subscriptions',
  '-H "Content-Type: application/json"',
  '-H "Authorization: <api-key>"',
  `-d '{"endpoint": "asdf-1234-ghjk-5678", "url": "https://www.reddit.com/r/Dotat2/.rss"}'`,
]);

const url = encodeURIComponent('https://www.reddit.com/.rss');

export const parseFeed = mkMultilineCmd([
  `curl https://api.therssproject.com/v1/feeds?url=${url}`,
  '-H "Authorization: <api-key>"',
]);
