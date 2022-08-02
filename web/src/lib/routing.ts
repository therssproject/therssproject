import * as Eq from 'fp-ts/Eq';
import {pipe} from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import {Eq as eqString} from 'fp-ts/string';
import {useStableEffect} from 'fp-ts-react-stable-hooks';
import {useRouter} from 'next/router';

import * as analytics from '@/lib/analytics';

import {AuthResponse, useSession} from '@/models/user';

import {noOp} from './effect';
import {format, match, parse, parseO, Route, RouteTag} from './routes';

// Navigates to login route on logged IN only pages
const publicRoutes = (push: (path: string) => void) => (route: Route) => {
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
      Feedback: noOp,
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
      AppSettingsGeneral: onPrivate,
      AppSettingsBilling: onPrivate,
    }),
  );
};

// Navigates to home (or the `returnTo`) route on logged OUT only pages
const privateRoutes = (push: (path: string) => void) => (route: Route) => {
  pipe(
    route,
    match({
      NotFound: noOp,

      // Public
      Index: noOp,
      Documentation: noOp,
      Feedback: noOp,
      Components: noOp,

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
      AppSettingsGeneral: noOp,
      AppSettingsBilling: noOp,
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
  const {session} = useSession();

  useStableEffect(
    () => {
      analytics.pageView();

      const route = parse(router.asPath);

      pipe(
        session,
        O.match(
          () => publicRoutes(router.push)(route),
          () => privateRoutes(router.push)(route),
        ),
      );
    },
    [session, router.asPath],
    Eq.tuple(eqSession, eqString),
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
