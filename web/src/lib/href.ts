import {format as formatRoute, Route} from './routes';

export type SafeHref = {tag: 'External'; path: string} | Route;

export const external = (path: string): SafeHref => ({tag: 'External', path});

export const format = (href: SafeHref) =>
  href.tag === 'External' ? href.path : formatRoute(href);
