/**
 * @type {import('next-sitemap').IConfig}
 * @see https://github.com/iamvishnusankar/next-sitemap#readme
 */
module.exports = {
  // TODO site url
  siteUrl: 'https://rss.dev',
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [{userAgent: '*', allow: '/'}],
  },
};
