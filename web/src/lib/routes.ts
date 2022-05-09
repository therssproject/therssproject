import {pipe} from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import * as Routing from 'fp-ts-routing';
import * as t from 'io-ts';

type NotFound = {tag: 'NotFound'};
type Dashboard = {tag: 'Dashboard'};
type Documentation = {tag: 'Documentation'};
type Index = {tag: 'Index'};
type Login = {tag: 'Login'; returnTo?: Route};
type Register = {tag: 'Register'; returnTo?: Route};
type Components = {tag: 'Components'};
type ResetPasswordRequest = {tag: 'ResetPasswordRequest'};
type ResetPasswordConfirm = {tag: 'ResetPasswordConfirm'; token: string};

export type Route =
  // Public
  | Index
  | Components
  | Documentation
  // Logged-in only
  | Dashboard
  // Logged-out only
  | Login
  | Register
  | ResetPasswordRequest
  | ResetPasswordConfirm
  // Misc
  | NotFound;

export type RouteTag = Route['tag'];

export const match =
  <R>(matcher: {
    Index: (r: Index) => R;
    Documentation: (r: Documentation) => R;
    Components: (r: Components) => R;
    Dashboard: (r: Dashboard) => R;
    Login: (r: Login) => R;
    Register: (r: Register) => R;
    ResetPasswordRequest: (r: ResetPasswordRequest) => R;
    ResetPasswordConfirm: (r: ResetPasswordConfirm) => R;
    NotFound: (r: NotFound) => R;
  }) =>
  (route: Route): R => {
    switch (route.tag) {
      case 'Dashboard':
        return matcher.Dashboard(route);
      case 'Documentation':
        return matcher.Documentation(route);
      case 'Index':
        return matcher.Index(route);
      case 'Components':
        return matcher.Components(route);
      case 'Login':
        return matcher.Login(route);
      case 'Register':
        return matcher.Register(route);
      case 'ResetPasswordRequest':
        return matcher.ResetPasswordRequest(route);
      case 'ResetPasswordConfirm':
        return matcher.ResetPasswordConfirm(route);
      case 'NotFound':
        return matcher.NotFound(route);
    }
  };

const index: Route = {tag: 'Index'};
const dashboard: Route = {tag: 'Dashboard'};
const documentation: Route = {tag: 'Documentation'};
const login = (returnTo?: Route): Route => ({tag: 'Login', returnTo});
const register = (returnTo?: Route): Route => ({tag: 'Register', returnTo});
const resetPasswordRequest: Route = {tag: 'ResetPasswordRequest'};
const resetPasswordConfirm = (token: string): Route => ({
  tag: 'ResetPasswordConfirm',
  token,
});
const components: Route = {tag: 'Components'};
const notFound: Route = {tag: 'NotFound'};

export const Route = {
  index,
  dashboard,
  documentation,
  login,
  register,
  components,
  resetPasswordRequest,
  resetPasswordConfirm,
  notFound,
};

const indexMatch = Routing.end;

const dashboardMatch = Routing.lit('dashboard').then(Routing.end);

const documentationMatch = Routing.lit('documentation').then(Routing.end);

// Optional query properties
// @reference: https://github.com/gcanti/fp-ts-routing/issues/59#issuecomment-800801913
const returnToQuery = Routing.query(t.exact(t.partial({returnTo: t.string})));

const loginMatch = Routing.lit('login').then(returnToQuery).then(Routing.end);

const registerMatch = Routing.lit('register')
  .then(returnToQuery)
  .then(Routing.end);

const componentsMatch = Routing.lit('components').then(Routing.end);

const resetPasswordRequestMatch = Routing.lit('reset-password').then(
  Routing.end,
);

const resetPasswordConfirmMatch = Routing.lit('reset-password')
  .then(Routing.str('token'))
  .then(Routing.end);

const _404Match = Routing.lit('404').then(Routing.end);

export const Match = {
  index: indexMatch,
  dashboard: dashboardMatch,
  documentation: documentationMatch,
  login: loginMatch,
  register: registerMatch,
  components: componentsMatch,
  resetPasswordRequest: resetPasswordRequestMatch,
  resetPasswordConfirm: resetPasswordConfirmMatch,
  _404: _404Match,
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
  .alt(Match.index.parser.map(() => Route.index))
  .alt(Match.dashboard.parser.map(() => Route.dashboard))
  .alt(Match.documentation.parser.map(() => Route.documentation))
  .alt(Match.login.parser.map(parseBackTo(Route.login)))
  .alt(Match.register.parser.map(parseBackTo(Route.register)))
  .alt(Match.resetPasswordRequest.parser.map(() => Route.resetPasswordRequest))
  .alt(
    Match.resetPasswordConfirm.parser.map(({token}) =>
      Route.resetPasswordConfirm(token),
    ),
  )
  .alt(Match.components.parser.map(() => Route.components))
  .alt(Match._404.parser.map(() => Route.notFound));

export const parse = (path: string): Route =>
  Routing.parse(router, Routing.Route.parse(path), notFound);

export const parseO = (path: string): O.Option<Route> =>
  Routing.parse(router.map(O.some), Routing.Route.parse(path), O.none);

export const format = (route: Route): string =>
  pipe(
    route,
    match<string>({
      Index: () => Routing.format(Match.index.formatter, {}),
      Dashboard: () => Routing.format(Match.dashboard.formatter, {}),
      Documentation: () => Routing.format(Match.documentation.formatter, {}),
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
      Components: () => Routing.format(Match.components.formatter, {}),
      NotFound: () => Routing.format(Match._404.formatter, {}),
    }),
  );
