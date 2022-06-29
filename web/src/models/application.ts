import {sequenceS} from 'fp-ts/Apply';
import * as A from 'fp-ts/Array';
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

import {useAtom} from '@/lib/jotai';
import {useRouteOfType} from '@/lib/routing';

import {AppEndpointsAtom, fetchEndpoints} from './endpoint';
import {AppLogsAtom, fetchLogs} from './log';
import {AppSubscriptionsAtom, fetchSubscriptions} from './subscription';

export const Application = te.sparseType({
  id: t.string,
  user: t.string,
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
    ],
    fold(O.getFirstMonoid()),
    O.map(({app}) => app),
  );

// TODO: should I use this one or the one bellow?
export const useCurrentApp_ = () => {
  const appId = useAppIdFromPath();
  const [apps, _setApps] = useAtom(AppsAtom);

  return pipe(
    sequenceS(O.Apply)({apps: RD.toOption(apps), id: appId}),
    O.chain(({apps, id}) =>
      pipe(
        apps,
        A.findFirst((app) => app.id === id),
      ),
    ),
  );
};

export const SelectedAppAtom = atom<O.Option<Application>>(O.none);

const useFetchOnAppChange = <Data>(
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

export const useFetchAppData = () => {
  const [currentApp, _setApp] = useAtom(SelectedAppAtom);

  const [subscriptions, setSubscriptions] = useAtom(AppSubscriptionsAtom);
  const [endpoints, setEndpoints] = useAtom(AppEndpointsAtom);
  const [logs, setLogs] = useAtom(AppLogsAtom);

  useFetchOnAppChange(
    (app) =>
      pipe(
        fetchSubscriptions(app.id),
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
        TE.mapLeft(() => 'Failed to fetch logs'),
      ),
    currentApp,
    logs,
    setLogs,
  );
};
