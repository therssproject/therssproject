import {sequenceS} from 'fp-ts/Apply';
import * as A from 'fp-ts/Array';
import {pipe} from 'fp-ts/function';
import {fold} from 'fp-ts/Monoid';
import * as O from 'fp-ts/Option';
import * as t from 'io-ts';
import * as te from 'io-ts-extra';
import {atom} from 'jotai';
import * as RD from 'remote-data-ts';

import {useAtom} from '@/lib/jotai';
import {useRouteOfType} from '@/lib/routing';

export const Application = te.sparseType({
  id: t.string,
  user: t.string,
  name: t.string,
  description: te.optional(t.string),
  created_at: t.string,
  updated_at: t.string,
});

export interface Application extends t.TypeOf<typeof Application> {}

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
  image: () => '',
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

export const useCurrentApp = () => {
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
