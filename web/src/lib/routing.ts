import {tuple} from 'fp-ts/Eq';
import * as Eq from 'fp-ts/Eq';
import {pipe} from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import {Eq as eqString} from 'fp-ts/string';
import {useStableEffect} from 'fp-ts-react-stable-hooks';
import {useRouter} from 'next/router';

import {useAtom} from '@/lib/jotai';

import {AuthResponse, SessionAtom} from '@/models/user';

import {format, match, parse, parseO, Route, RouteTag} from './routes';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noOp = () => {};

// Navigates to login route on logged IN only pages
const loggedOutGuard = (push: (path: string) => void) => (route: Route) => {
  const onPrivate = (route: Route) =>
    pipe(
      // Don't include home in the url since it's the default page to return
      route.tag === 'Dashboard' ? undefined : route,
      Route.login,
      format,
      push,
    );

  pipe(
    route,
    match({
      NotFound: noOp,

      // Public
      Index: noOp,
      Documentation: noOp,
      Components: noOp,

      // Public (logged-out only)
      Login: noOp,
      Register: noOp,
      ResetPasswordRequest: noOp,
      ResetPasswordConfirm: noOp,

      // Private
      Dashboard: onPrivate,
      AppDashboard: onPrivate,
      AppEndpoints: onPrivate,
      AppSubs: onPrivate,
      AppLogs: onPrivate,
      AppSettingsKeys: onPrivate,
      AppSettingsMembers: onPrivate,
    }),
  );
};

// Navigates to home (or the `returnTo`) route on logged OUT only pages
const loggedInGuard = (push: (path: string) => void) => (route: Route) => {
  pipe(
    route,
    match({
      NotFound: noOp,

      // Public
      Index: noOp,
      Components: noOp,
      Documentation: noOp,

      // Public (logged-out only)
      Login: ({returnTo}) => pipe(returnTo ?? Route.dashboard, format, push),
      Register: ({returnTo}) => pipe(returnTo ?? Route.dashboard, format, push),
      ResetPasswordRequest: () => pipe(Route.dashboard, format, push),
      ResetPasswordConfirm: () => pipe(Route.dashboard, format, push),

      // Private
      Dashboard: noOp,
      AppDashboard: noOp,
      AppEndpoints: noOp,
      AppSubs: noOp,
      AppLogs: noOp,
      AppSettingsKeys: noOp,
      AppSettingsMembers: noOp,
    }),
  );
};

const eqSession = pipe(
  eqString,
  Eq.contramap((s: AuthResponse) => s.access_token),
  O.getEq,
);

export const useSessionGuard = () => {
  const router = useRouter();
  const [session] = useAtom(SessionAtom);

  useStableEffect(
    () => {
      const route = parse(router.asPath);

      pipe(
        session,
        O.match(
          () => loggedOutGuard(router.push)(route),
          () => loggedInGuard(router.push)(route),
        ),
      );
    },
    [session],
    tuple(eqSession),
  );
};

export const useCurrentRoute = (): Route => pipe(useRouter().asPath, parse);

export const useRouteOfType = <T extends RouteTag, R extends Route & {tag: T}>(
  expected: T,
): O.Option<Extract<Route, R>> => {
  const router = useRouter();

  return pipe(
    router.asPath,
    parseO,
    O.filter((route): route is Extract<Route, R> => route.tag === expected),
  );
};
