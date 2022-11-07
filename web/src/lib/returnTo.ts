import * as Route from './routes';

export type t = Route.Route;

export const parse = (returnTo?: string): t | undefined => {
  if (returnTo) {
    const route = Route.parse(returnTo);

    return route.tag === 'Login' ||
      route.tag === 'Register' ||
      route.tag === 'NotFound' ||
      route.tag === 'ResetPasswordRequest' ||
      route.tag === 'ResetPasswordConfirm'
      ? undefined
      : route;
  }

  return undefined;
};

export const format = (route?: Route.Route) =>
  route ? Route.format(route) : undefined;
