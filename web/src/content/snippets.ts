export const registerEndpoint = [
  'curl https://api.therssproject.com/v1/endpoints ',
  '-H "Authorization: <api-key>" ',
  `-d '{"title": "My endpoint", "url": "https://myserver.com/webhooks/rss"}'`,
].join('\\\n');
