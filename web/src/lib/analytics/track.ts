import * as analytics from './index';

export const freeTrial = (email: string) => {
  analytics.event('start_free_trial', {email: email ? email : null});
};

export const landingRegister = () => {
  analytics.event('landing_page_register');
};

export const landingLogin = () => {
  analytics.event('landing_page_login');
};

export const landingResource = (resource: string) => {
  analytics.event('landing_page_open_resource', {resource});
};

export const externalLink = (href: string) => {
  analytics.event('visit_external_link', {href});
};

export const openDocs = () => {
  analytics.event('open_docs');
};

export const selectComingSoon = () => {
  analytics.event('select_coming_soon_app');
};

export const copySnippet = (snippet: string) => {
  analytics.event('copy_snippet', {snippet});
};

export const copyId = (type: 'sub' | 'endpoint' | 'key') => {
  analytics.event('copy_id', {type});
};

export const tryCloseKeyGenerated = () => {
  analytics.event('attempt_to_close_key_form');
};
