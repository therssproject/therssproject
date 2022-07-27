declare global {
  interface Window {
    $crisp: unknown[];
    CRISP_WEBSITE_ID: string;
  }
}

export const laod = () => {
  window.$crisp = [];
  window.CRISP_WEBSITE_ID = '1d0eca14-3df3-4ff0-b675-fcebb21f4525';

  const s = document.createElement('script');
  s.src = 'https://client.crisp.chat/l.js';
  s.async = true;
  document.getElementsByTagName('head')[0].appendChild(s);
};

export const clearEmail = () => window.$crisp.push(['set', 'user:email', []]);

export const setEmail = (email: string) =>
  window.$crisp.push(['set', 'user:email', [email]]);

export const openChat = () => window.$crisp.push(['do', 'chat:open']);

export const hide = () => window.$crisp.push(['do', 'chat:hide']);

export const show = () => window.$crisp.push(['do', 'chat:show']);
