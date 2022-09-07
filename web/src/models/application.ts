import addDays from 'date-fns/addDays';
import * as A from 'fp-ts/Array';
import * as Eq from 'fp-ts/Eq';
import {pipe} from 'fp-ts/function';
import {fold} from 'fp-ts/Monoid';
import {Eq as eqNumber} from 'fp-ts/number';
import * as O from 'fp-ts/Option';
import {Eq as eqString} from 'fp-ts/string';
import * as TE from 'fp-ts/TaskEither';
import {useStableEffect} from 'fp-ts-react-stable-hooks';
import * as t from 'io-ts';
import * as te from 'io-ts-extra';
import {atom, useSetAtom} from 'jotai';
import * as RD from 'remote-data-ts';

import {noOp} from '@/lib/effect';
import * as http from '@/lib/fetch';
import {useAtom} from '@/lib/jotai';
import {useRouteOfType} from '@/lib/routing';

import {AppEndpointsAtom, fetchEndpoints} from './endpoint';
import {AppLogsAtom, fetchLogs} from './log';
import {AppSubscriptionsAtom, fetchSubscriptions} from './subscription';

export const Application = te.sparseType({
  id: t.string,
  owner: t.string,
  name: t.string,
  description: te.optional(t.string),
  created_at: t.string,
  updated_at: t.string,
});

export interface Application extends t.TypeOf<typeof Application> {}

export const eqApplication = pipe(
  eqString,
  Eq.contramap(({id}: Application) => id),
);

export type AppOption =
  | {
      type: 'soon';
      id: 'comming_soon';
      label: string;
      image: () => string;
      disabled: boolean;
    }
  | ({type: 'app'; label: string} & Application);

export const SOON: AppOption = {
  type: 'soon',
  id: 'comming_soon',
  label: 'Comming soon',
  image: () => '+',
  disabled: true,
};

export const appToOption = (app: Application): AppOption => ({
  ...app,
  type: 'app',
  label: app.name,
});

type AppsState = RD.RemoteData<string, Application[]>;

export const AppsAtom = atom<AppsState>(RD.notAsked);

export const useAppIdFromPath = () =>
  pipe(
    [
      useRouteOfType('AppDashboard'),
      useRouteOfType('AppEndpoints'),
      useRouteOfType('AppSubs'),
      useRouteOfType('AppLogs'),
      useRouteOfType('AppSettingsKeys'),
      useRouteOfType('AppSettingsMembers'),
      useRouteOfType('AppSettingsGeneral'),
      useRouteOfType('AppSettingsBilling'),
    ],
    fold(O.getFirstMonoid()),
    O.map(({app}) => app),
  );

export const resetApp = (app: string) =>
  http.post_(`/applications/${app}/reset`, null);

export const SelectedAppAtom = atom<O.Option<Application>>(O.none);

// TODO: better approach!!! xD
// This is a hack to get the app atoms to refetch
const RefetchAppDataAtom = atom(0);

export const useRefetchAppData = () => {
  const setRefetch = useSetAtom(RefetchAppDataAtom);

  return {refetchAppData: () => setRefetch((n) => n + 1)};
};

export const useFetchOnAppChange = <Data>(
  fetch: (app: Application) => TE.TaskEither<string, Data>,
  currentApp: O.Option<Application>,
  currentData: RD.RemoteData<string, Data>,
  setData: (data: RD.RemoteData<string, Data>) => void,
) => {
  const [flag, _setFlag] = useAtom(RefetchAppDataAtom);

  useStableEffect(
    () => {
      const app = O.toUndefined(currentApp);

      if (!app) {
        return;
      }

      if (RD.isNotAsked(currentData) || RD.isFailure(currentData)) {
        setData(RD.loading);
      }

      const run = pipe(
        fetch(app),
        TE.match(
          (msg) => setData(RD.failure(msg)),
          (data) => setData(RD.success(data)),
        ),
      );

      run();
    },
    [currentApp, flag],
    Eq.tuple(O.getEq(eqApplication), eqNumber),
  );
};

type Trend = {
  cur: number;
  prev: number;
  change: number;
  trend: 'increase' | 'decrease' | 'none';
};

type Stats = {
  subs: Trend;
  logs: Trend;
};

export const StatsAtom = atom<O.Option<Stats>>(O.none);

const mkTrend = ({cur, prev}: {cur: number; prev: number}): Trend => {
  const change = Math.floor(Math.abs(100 - (cur * 100) / prev));

  return {
    cur,
    prev,
    change,
    trend:
      cur === prev || change === Infinity
        ? 'none'
        : cur > prev
        ? 'increase'
        : 'decrease',
  };
};

const grabCount = (res: http.Res<unknown>) =>
  parseInt(res.headers.get('x-pagination-count') ?? '');

const fetchStats = (app: string) =>
  pipe(
    new Date(),
    (now) => ({
      lastWeek: addDays(now, -7).toISOString(),
      twoWeeksAgo: addDays(now, -14).toISOString(),
    }),
    ({lastWeek, twoWeeksAgo}) => [
      // Fetch subscriptions and logs should use a limit of 0 but the backend
      // doesn't support this yet, so as a workaround we use 1.
      fetchSubscriptions(app, {limit: 1, from: lastWeek}),
      fetchSubscriptions(app, {limit: 1, from: twoWeeksAgo}),
      fetchLogs(app, {limit: 1, from: lastWeek}),
      fetchLogs(app, {limit: 1, from: twoWeeksAgo}),
    ],
    A.map(TE.map(grabCount)),
    TE.sequenceArray,
    TE.map(([subsCur, subsPrev, logsCur, logsPrev]) => ({
      subs: mkTrend({cur: subsCur, prev: subsPrev - subsCur}),
      logs: mkTrend({cur: logsCur, prev: logsPrev - logsCur}),
    })),
    TE.mapLeft(() => 'Failed to fetch stats'),
  );

const useFetchAppStats = (currentApp: O.Option<Application>) => {
  const [_stats, setStats] = useAtom(StatsAtom);
  const [flag, _setFlag] = useAtom(RefetchAppDataAtom);

  useStableEffect(
    () => {
      setStats(O.none);

      const app = O.toUndefined(currentApp);

      if (!app) {
        return;
      }

      const run = pipe(
        fetchStats(app.id),
        TE.match(noOp, (stats) => setStats(O.some(stats))),
      );

      run();
    },
    [currentApp, flag],
    Eq.tuple(O.getEq(eqApplication), eqNumber),
  );
};

export const useFetchAppData = () => {
  const [currentApp, _setApp] = useAtom(SelectedAppAtom);

  const [subscriptions, setSubscriptions] = useAtom(AppSubscriptionsAtom);
  const [endpoints, setEndpoints] = useAtom(AppEndpointsAtom);
  const [logs, setLogs] = useAtom(AppLogsAtom);

  useFetchAppStats(currentApp);

  useFetchOnAppChange(
    (app) =>
      pipe(
        fetchSubscriptions(app.id),
        TE.map((res) => res.data),
        TE.mapLeft(() => 'Failed to fetch subscriptions'),
      ),
    currentApp,
    subscriptions,
    setSubscriptions,
  );

  useFetchOnAppChange(
    (app) =>
      pipe(
        fetchEndpoints(app.id),
        TE.map((res) => res.data),
        TE.mapLeft(() => 'Failed to fetch endpoints'),
      ),
    currentApp,
    endpoints,
    setEndpoints,
  );

  // useFetchOnAppChange(
  //   (app) =>
  //     pipe(
  //       fetchLogs(app.id),
  //       TE.map((res) => res.data),
  //       TE.mapLeft(() => 'Failed to fetch logs'),
  //     ),
  //   currentApp,
  //   logs,
  //   setLogs,
  // );
};
