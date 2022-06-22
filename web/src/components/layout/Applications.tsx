import {MenuIcon} from '@heroicons/react/outline';
import {sequenceS} from 'fp-ts/Apply';
import * as A from 'fp-ts/Array';
import {pipe} from 'fp-ts/function';
import {fold} from 'fp-ts/Monoid';
import * as O from 'fp-ts/Option';
import * as TE from 'fp-ts/TaskEither';
import * as t from 'io-ts';
import {useRouter} from 'next/router';
import {ReactNode, useEffect, useState} from 'react';
import * as RD from 'remote-data-ts';
import {match} from 'ts-pattern';

import * as http from '@/lib/fetch';
import {useAtom} from '@/lib/jotai';
import {format as formatRoute, Route} from '@/lib/routes';
import {useRouteOfType} from '@/lib/routing';

import {Select} from '@/components/Select';
import {Props as SeoProps, Seo} from '@/components/Seo';
import {Sidebar} from '@/components/Sidebar';

import {
  Application,
  AppOption,
  AppsAtom,
  appToOption,
  SOON,
} from '@/models/application';
import {useSession} from '@/models/user';

type Props = {
  title: string;
  children: ReactNode;
  seo?: SeoProps;
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noOp = () => {};

const useAppIdFromPath = () =>
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

export const Applications = ({title, children, seo}: Props) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  const {session, logOut} = useSession();
  const [apps, setApps] = useAtom(AppsAtom);

  const appId = useAppIdFromPath();

  const selected = pipe(
    sequenceS(O.Apply)({apps: RD.toOption(apps), id: appId}),
    O.chain(({apps, id}) =>
      pipe(
        apps,
        A.findFirst((app) => app.id === id),
      ),
    ),
    O.map(appToOption),
    O.toUndefined,
  );

  const onSelect = (opt?: AppOption) => {
    match(opt)
      .with({type: 'app'}, (app) => {
        router.push(formatRoute(Route.appDashboard(app.id)));
      })
      .otherwise(noOp);
  };

  useEffect(
    () => {
      if (!RD.isSuccess(apps)) {
        setApps(RD.loading);
      }

      pipe(
        http.get('/applications', t.array(Application)),
        TE.match(
          () => {
            if (!RD.isSuccess(apps)) {
              setApps(RD.failure('Failed to fetch'));
            }
          },
          (res) => {
            setApps(RD.success(res));

            pipe(
              res,
              A.head,
              O.filter(() => Boolean(!selected)),
              O.map(appToOption),
              O.match(noOp, onSelect),
            );
          },
        ),
      )();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const appSelector = {
    // TODO: use derived atom?
    options: pipe(
      apps,
      RD.map(A.map(appToOption)),
      RD.map((res) => res.concat(SOON)),
      RD.toOption,
      O.getOrElse((): AppOption[] => []),
    ),
    selected,
    onSelect,
    disabled: !RD.isSuccess(apps),
  };

  return pipe(
    session,
    O.match(
      // TODO: skeleton when session is missing?
      //       Eg. go to Documentation and then log out
      () => null,
      ({user}) => (
        <div className="mx-auto w-full max-w-screen-2xl">
          <Seo {...seo} />

          <Sidebar
            isOpen={sidebarOpen}
            user={user}
            onOpen={() => setSidebarOpen(true)}
            onClose={() => setSidebarOpen(false)}
            onLogout={logOut}
            appSelector={appSelector}
          />

          <div className="flex flex-1 flex-col md:pl-64">
            {/* Mobile nav */}
            <div className="sticky top-0 z-10 flex justify-between bg-white pl-1 pt-1 sm:pl-3 sm:pt-3 md:hidden">
              <button
                type="button"
                className="-ml-0.5 -mt-0.5 inline-flex h-12 w-12 items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                onClick={() => setSidebarOpen(true)}
              >
                <span className="sr-only">Open sidebar</span>
                <MenuIcon className="h-6 w-6" aria-hidden="true" />
              </button>

              <div className="mx-2 w-40">
                <Select {...appSelector} />
              </div>
            </div>

            <main className="flex-1">
              <div className="space-y-8 py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
                  <h1 className="text-4xl font-semibold text-gray-700">
                    {title}
                  </h1>
                </div>
                <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
                  {children}
                </div>
              </div>
            </main>
          </div>
        </div>
      ),
    ),
  );
};
