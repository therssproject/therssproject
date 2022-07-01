import {pipe} from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import * as Routing from 'fp-ts-routing';
import * as t from 'io-ts';

type NotFound = {tag: 'NotFound'};
// Public
type Documentation = {tag: 'Documentation'};
type Index = {tag: 'Index'};

// Public (logged-out only)
type Login = {tag: 'Login'; returnTo?: Route};
type Register = {tag: 'Register'; returnTo?: Route};
type Components = {tag: 'Components'};
type ResetPasswordRequest = {tag: 'ResetPasswordRequest'};
type ResetPasswordConfirm = {tag: 'ResetPasswordConfirm'; token: string};

// Private (logged-in only)
type Dashboard = {tag: 'Dashboard'};
type AppDashboard = {tag: 'AppDashboard'; app: string};
type AppEndpoints = {tag: 'AppEndpoints'; app: string; create: boolean};
type AppSubs = {tag: 'AppSubs'; app: string};
type AppLogs = {tag: 'AppLogs'; app: string};
type AppSettingsKeys = {tag: 'AppSettingsKeys'; app: string};
type AppSettingsMembers = {tag: 'AppSettingsMembers'; app: string};

export type Route =
  | NotFound
  // Public
  | Index
  | Components
  | Documentation
  // Public (logged-out only)
  | Login
  | Register
  | ResetPasswordRequest
  | ResetPasswordConfirm
  // Private (logged-in only)
  | Dashboard
  | AppDashboard
  | AppEndpoints
  | AppSubs
  | AppLogs
  | AppSettingsKeys
  | AppSettingsMembers;

export type RouteTag = Route['tag'];

type RouteMatcher<R> = {
  NotFound: (r: NotFound) => R;

  // Public
  Index: (r: Index) => R;
  Documentation: (r: Documentation) => R;
  Components: (r: Components) => R;

  // Public (logged-out only)
  Login: (r: Login) => R;
  Register: (r: Register) => R;
  ResetPasswordRequest: (r: ResetPasswordRequest) => R;
  ResetPasswordConfirm: (r: ResetPasswordConfirm) => R;

  // Private
  Dashboard: (r: Dashboard) => R;
  AppDashboard: (r: AppDashboard) => R;
  AppEndpoints: (r: AppEndpoints) => R;
  AppSubs: (r: AppSubs) => R;
  AppLogs: (r: AppLogs) => R;
  AppSettingsKeys: (r: AppSettingsKeys) => R;
  AppSettingsMembers: (r: AppSettingsMembers) => R;
};

export const match =
  <R>(matcher: RouteMatcher<R>) =>
  (route: Route): R => {
    switch (route.tag) {
      case 'NotFound':
        return matcher.NotFound(route);

      // Public
      case 'Documentation':
        return matcher.Documentation(route);
      case 'Index':
        return matcher.Index(route);
      case 'Components':
        return matcher.Components(route);

      // Public (logged-out only)
      case 'Login':
        return matcher.Login(route);
      case 'Register':
        return matcher.Register(route);
      case 'ResetPasswordRequest':
        return matcher.ResetPasswordRequest(route);
      case 'ResetPasswordConfirm':
        return matcher.ResetPasswordConfirm(route);

      // Private
      case 'Dashboard':
        return matcher.Dashboard(route);
      case 'AppDashboard':
        return matcher.AppDashboard(route);
      case 'AppEndpoints':
        return matcher.AppEndpoints(route);
      case 'AppSubs':
        return matcher.AppSubs(route);
      case 'AppLogs':
        return matcher.AppLogs(route);
      case 'AppSettingsKeys':
        return matcher.AppSettingsKeys(route);
      case 'AppSettingsMembers':
        return matcher.AppSettingsMembers(route);
    }
  };

export const matchP =
  <R>(matcher: Partial<RouteMatcher<R>> & {__: (route: Route) => R}) =>
  (route: Route): R => {
    switch (route.tag) {
      case 'NotFound':
        return (matcher.NotFound ?? matcher.__)(route);

      // Public
      case 'Documentation':
        return (matcher.Documentation ?? matcher.__)(route);
      case 'Index':
        return (matcher.Index ?? matcher.__)(route);
      case 'Components':
        return (matcher.Components ?? matcher.__)(route);

      // Public (logged-out only)
      case 'Login':
        return (matcher.Login ?? matcher.__)(route);
      case 'Register':
        return (matcher.Register ?? matcher.__)(route);
      case 'ResetPasswordRequest':
        return (matcher.ResetPasswordRequest ?? matcher.__)(route);
      case 'ResetPasswordConfirm':
        return (matcher.ResetPasswordConfirm ?? matcher.__)(route);

      // Private
      case 'Dashboard':
        return (matcher.Dashboard ?? matcher.__)(route);
      case 'AppDashboard':
        return (matcher.AppDashboard ?? matcher.__)(route);
      case 'AppEndpoints':
        return (matcher.AppEndpoints ?? matcher.__)(route);
      case 'AppSubs':
        return (matcher.AppSubs ?? matcher.__)(route);
      case 'AppLogs':
        return (matcher.AppLogs ?? matcher.__)(route);
      case 'AppSettingsKeys':
        return (matcher.AppSettingsKeys ?? matcher.__)(route);
      case 'AppSettingsMembers':
        return (matcher.AppSettingsMembers ?? matcher.__)(route);
    }
  };

const notFound: Route = {tag: 'NotFound'};

// Public
const index: Route = {tag: 'Index'};
const documentation: Route = {tag: 'Documentation'};
const components: Route = {tag: 'Components'};

// Public (logged-out only)
const login = (returnTo?: Route): Route => ({tag: 'Login', returnTo});
const register = (returnTo?: Route): Route => ({tag: 'Register', returnTo});
const resetPasswordRequest: Route = {tag: 'ResetPasswordRequest'};
const resetPasswordConfirm = (token: string): Route => ({
  tag: 'ResetPasswordConfirm',
  token,
});

// Private
const dashboard: Route = {tag: 'Dashboard'};
const appDashboard = (app: string): Route => ({tag: 'AppDashboard', app});
const appEndpoints = (app: string, create: boolean): Route => ({
  tag: 'AppEndpoints',
  app,
  create,
});
const appSubs = (app: string): Route => ({tag: 'AppSubs', app});
const appLogs = (app: string): Route => ({tag: 'AppLogs', app});
const appSettingsKeys = (app: string): Route => ({tag: 'AppSettingsKeys', app});
const appSettingsMembers = (app: string): Route => ({
  tag: 'AppSettingsMembers',
  app,
});

export const Route = {
  notFound,

  // Public
  index,
  documentation,
  components,

  // Public (logged-out only)
  login,
  register,
  resetPasswordRequest,
  resetPasswordConfirm,

  // Private
  dashboard,
  appDashboard,
  appEndpoints,
  appSubs,
  appLogs,
  appSettingsKeys,
  appSettingsMembers,
};

// Optional query properties
// @reference: https://github.com/gcanti/fp-ts-routing/issues/59#issuecomment-800801913
const returnToQuery = Routing.query(t.exact(t.partial({returnTo: t.string})));

const _404Match = Routing.lit('404').then(Routing.end);

// Public
const indexMatch = Routing.end;
const componentsMatch = Routing.lit('components').then(Routing.end);
const documentationMatch = Routing.lit('documentation').then(Routing.end);

// Public (logged-out only)
const loginMatch = Routing.lit('login').then(returnToQuery).then(Routing.end);
const registerMatch = Routing.lit('register')
  .then(returnToQuery)
  .then(Routing.end);
const resetPasswordRequestMatch = Routing.lit('reset-password').then(
  Routing.end,
);
const resetPasswordConfirmMatch = Routing.lit('reset-password')
  .then(Routing.str('token'))
  .then(Routing.end);

// Private
const dashboardMatch = Routing.lit('dashboard').then(Routing.end);
const appDashboardMatch = Routing.lit('app')
  .then(Routing.str('app'))
  .then(Routing.lit('dashboard'))
  .then(Routing.end);
const appEndpointsMatch = Routing.lit('app')
  .then(Routing.str('app'))
  .then(Routing.lit('endpoints'))
  .then(Routing.query(t.exact(t.partial({create: t.string}))))
  .then(Routing.end);
const appSubsMatch = Routing.lit('app')
  .then(Routing.str('app'))
  .then(Routing.lit('subscriptions'))
  .then(Routing.end);
const appLogsMatch = Routing.lit('app')
  .then(Routing.str('app'))
  .then(Routing.lit('logs'))
  .then(Routing.end);
const appSettingsKeysMatch = Routing.lit('app')
  .then(Routing.str('app'))
  .then(Routing.lit('settings'))
  .then(Routing.lit('keys'))
  .then(Routing.end);
const appSettingsMembersMatch = Routing.lit('app')
  .then(Routing.str('app'))
  .then(Routing.lit('settings'))
  .then(Routing.lit('members'))
  .then(Routing.end);

export const Match = {
  _404: _404Match,
  // Public
  index: indexMatch,
  documentation: documentationMatch,
  components: componentsMatch,

  // Public (logged-out only)
  login: loginMatch,
  register: registerMatch,
  resetPasswordRequest: resetPasswordRequestMatch,
  resetPasswordConfirm: resetPasswordConfirmMatch,

  // Private
  dashboard: dashboardMatch,
  appDashboard: appDashboardMatch,
  appEndpoints: appEndpointsMatch,
  appSubs: appSubsMatch,
  appLogs: appLogsMatch,
  appSettingsKeys: appSettingsKeysMatch,
  appSettingsMembers: appSettingsMembersMatch,
};

const parseBackTo =
  (mkRoute: (returnTo?: Route) => Route) =>
  ({returnTo}: {returnTo?: string}): Route => {
    if (returnTo) {
      const route = parse(returnTo);

      const dontGoBackTo =
        route.tag === 'Login' ||
        route.tag === 'Register' ||
        route.tag === 'NotFound';

      return dontGoBackTo ? mkRoute() : mkRoute(route);
    }

    return mkRoute();
  };

const router = Routing.zero<Route>()
  // Public
  .alt(Match.index.parser.map(() => Route.index))
  .alt(Match.documentation.parser.map(() => Route.documentation))
  .alt(Match.components.parser.map(() => Route.components))

  // Public (logged-out only)
  .alt(Match.login.parser.map(parseBackTo(Route.login)))
  .alt(Match.register.parser.map(parseBackTo(Route.register)))
  .alt(Match.resetPasswordRequest.parser.map(() => Route.resetPasswordRequest))
  .alt(
    Match.resetPasswordConfirm.parser.map(({token}) =>
      Route.resetPasswordConfirm(token),
    ),
  )

  // Private
  .alt(Match.dashboard.parser.map(() => Route.dashboard))
  .alt(Match.appDashboard.parser.map(({app}) => Route.appDashboard(app)))
  .alt(
    Match.appEndpoints.parser.map(({app, create}) =>
      Route.appEndpoints(app, create === '1' || create === 'true'),
    ),
  )
  .alt(Match.appSubs.parser.map(({app}) => Route.appSubs(app)))
  .alt(Match.appLogs.parser.map(({app}) => Route.appLogs(app)))
  .alt(Match.appSettingsKeys.parser.map(({app}) => Route.appSettingsKeys(app)))
  .alt(
    Match.appSettingsMembers.parser.map(({app}) =>
      Route.appSettingsMembers(app),
    ),
  )

  // Misc
  .alt(Match._404.parser.map(() => Route.notFound));

export const parse = (path: string): Route =>
  Routing.parse(router, Routing.Route.parse(path), notFound);

export const parseO = (path: string): O.Option<Route> =>
  Routing.parse(router.map(O.some), Routing.Route.parse(path), O.none);

export const format = (route: Route): string =>
  pipe(
    route,
    match<string>({
      NotFound: () => Routing.format(Match._404.formatter, {}),

      // Public
      Index: () => Routing.format(Match.index.formatter, {}),
      Documentation: () => Routing.format(Match.documentation.formatter, {}),
      Components: () => Routing.format(Match.components.formatter, {}),

      // Public (logged-out only)
      Login: ({returnTo}) =>
        Routing.format(
          Match.login.formatter,
          returnTo ? {returnTo: format(returnTo)} : {},
        ),
      Register: ({returnTo}) =>
        Routing.format(
          Match.register.formatter,
          returnTo ? {returnTo: format(returnTo)} : {},
        ),
      ResetPasswordRequest: () =>
        Routing.format(Match.resetPasswordRequest.formatter, {}),
      ResetPasswordConfirm: ({token}) =>
        Routing.format(Match.resetPasswordConfirm.formatter, {token}),

      // Private
      Dashboard: () => Routing.format(Match.dashboard.formatter, {}),
      AppDashboard: ({app}) =>
        Routing.format(Match.appDashboard.formatter, {app}),
      AppEndpoints: ({app, create}) =>
        Routing.format(Match.appEndpoints.formatter, {
          app,
          create: create ? 'true' : undefined,
        }),
      AppSubs: ({app}) => Routing.format(Match.appSubs.formatter, {app}),
      AppLogs: ({app}) => Routing.format(Match.appLogs.formatter, {app}),
      AppSettingsKeys: ({app}) =>
        Routing.format(Match.appSettingsKeys.formatter, {app}),
      AppSettingsMembers: ({app}) =>
        Routing.format(Match.appSettingsMembers.formatter, {app}),
    }),
  );
