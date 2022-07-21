import {sequenceT} from 'fp-ts/Apply';
import * as Eq from 'fp-ts/Eq';
import {pipe} from 'fp-ts/function';
import {fold} from 'fp-ts/Monoid';
import * as O from 'fp-ts/Option';
import {Eq as eqString} from 'fp-ts/string';
import * as TE from 'fp-ts/TaskEither';
import {useStableEffect} from 'fp-ts-react-stable-hooks';
import * as t from 'io-ts';
import * as te from 'io-ts-extra';
import {atom} from 'jotai';
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
    ],
    fold(O.getFirstMonoid()),
    O.map(({app}) => app),
  );

export const SelectedAppAtom = atom<O.Option<Application>>(O.none);

export const useFetchOnAppChange = <Data>(
  fetch: (app: Application) => TE.TaskEither<string, Data>,
  currentApp: O.Option<Application>,
  currentData: RD.RemoteData<string, Data>,
  setData: (data: RD.RemoteData<string, Data>) => void,
) => {
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
    [currentApp],
    Eq.tuple(O.getEq(eqApplication)),
  );
};

type Stats = {
  subs: number;
  logs: number;
};

export const StatsAtom = atom<O.Option<Stats>>(O.none);

const grabCount = (res: http.Res<unknown>) =>
  parseInt(res.headers.get('x-pagination-count') ?? '');

const fetchStats = (app: string) =>
  pipe(
    sequenceT(TE.ApplyPar)(
      pipe(fetchSubscriptions(app, {limit: 0}), TE.map(grabCount)),
      pipe(fetchLogs(app, {limit: 0}), TE.map(grabCount)),
    ),
    TE.map(([subs, logs]) => ({subs, logs})),
    TE.mapLeft(() => 'Failed to fetch stats'),
  );

const useFetchAppStats = (currentApp: O.Option<Application>) => {
  const [_stats, setStats] = useAtom(StatsAtom);

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
    [currentApp],
    Eq.tuple(O.getEq(eqApplication)),
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

  useFetchOnAppChange(
    (app) =>
      pipe(
        fetchLogs(app.id),
        TE.map((res) => res.data),
        TE.mapLeft(() => 'Failed to fetch logs'),
      ),
    currentApp,
    logs,
    setLogs,
  );
};
