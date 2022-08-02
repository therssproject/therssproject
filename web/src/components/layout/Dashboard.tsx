import {MenuIcon} from '@heroicons/react/outline';
import * as A from 'fp-ts/Array';
import {pipe} from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import * as TE from 'fp-ts/TaskEither';
import * as t from 'io-ts';
import {useRouter} from 'next/router';
import {ReactNode, useEffect, useState} from 'react';
import * as RD from 'remote-data-ts';
import {match, P} from 'ts-pattern';

import * as track from '@/lib/analytics/track';
import {noOp} from '@/lib/effect';
import * as http from '@/lib/fetch';
import {useAtom} from '@/lib/jotai';
import {format as formatRoute, Route} from '@/lib/routes';
import {useCurrentRoute} from '@/lib/routing';

import {Select} from '@/components/Select';
import {Props as SeoProps, Seo} from '@/components/Seo';
import {Sidebar} from '@/components/Sidebar';

import {
  Application,
  AppOption,
  AppsAtom,
  appToOption,
  SelectedAppAtom,
  SOON,
} from '@/models/application';
import {useSession} from '@/models/user';

type Props = {
  title: string;
  children: ReactNode;
  goToAppOnLoad: boolean;
  seo?: SeoProps;
};

export const Dashboard = ({title, children, seo, goToAppOnLoad}: Props) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const currentRoute = useCurrentRoute();

  const {session, logOut} = useSession();
  const [apps, setApps] = useAtom(AppsAtom);
  const [currentApp, setCurrentApp] = useAtom(SelectedAppAtom);

  const onSelect = (opt?: AppOption) => {
    match([opt, currentRoute])
      // Only the Dashboard page redirects to the selected application dashboard
      .with([{type: 'app'}, {tag: 'Dashboard'}], ([app]) => {
        router.push(formatRoute(Route.appDashboard((app as Application).id)));
        setCurrentApp(O.some(app as Application));
      })
      .with([{type: 'app'}, P._], ([app]) => {
        setCurrentApp(O.some(app as Application));
      })
      .otherwise(() => track.selectComingSoon());
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
            setApps(RD.success(res.data));

            pipe(
              res.data,
              A.head,
              O.map(appToOption),
              O.filter(() => goToAppOnLoad),
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
    // TODO: use SelectedAppAtom instead
    options: pipe(
      apps,
      RD.map(A.map(appToOption)),
      RD.map((res) => res.concat(SOON)),
      RD.toOption,
      O.getOrElse((): AppOption[] => []),
    ),
    selected: pipe(currentApp, O.map(appToOption), O.toUndefined),
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
