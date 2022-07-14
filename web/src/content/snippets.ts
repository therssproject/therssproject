export const createEndpoint = [
  'curl https://api.therssproject.com/applications/add ',
  '-H "Authorization: Bearer <api-key>" ',
  `-d '{"title": "My endpoint", "url": "https://myserver.com/webhooks/rss"}'`,
].join('\\\n');
