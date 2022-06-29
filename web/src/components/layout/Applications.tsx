import {MenuIcon} from '@heroicons/react/outline';
import {HomeIcon} from '@heroicons/react/solid';
import * as A from 'fp-ts/Array';
import {pipe} from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import * as TE from 'fp-ts/TaskEither';
import * as t from 'io-ts';
import {useRouter} from 'next/router';
import {ReactNode, useEffect, useState} from 'react';
import * as RD from 'remote-data-ts';
import {match} from 'ts-pattern';

import * as http from '@/lib/fetch';
import {useAtom} from '@/lib/jotai';
import {
  format as formatRoute,
  matchP as matchRouteP,
  Route,
} from '@/lib/routes';
import {useCurrentRoute} from '@/lib/routing';

import {UnstyledLink} from '@/components/links/UnstyledLink';
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
  useAppIdFromPath,
  useFetchAppData,
} from '@/models/application';
import {useSession} from '@/models/user';

type Props = {
  title: string;
  children: ReactNode;
  seo?: SeoProps;
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noOp = () => {};

export const Applications = ({title, children, seo}: Props) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const appId = useAppIdFromPath();
  const isInAppsRoute = O.isNone(appId);

  const {session, logOut} = useSession();
  const [apps, setApps] = useAtom(AppsAtom);
  const [currentApp, setCurrentApp] = useAtom(SelectedAppAtom);

  const selected = pipe(currentApp, O.map(appToOption), O.toUndefined);

  useFetchAppData();

  // TODO: clean this up
  const onSelect = (opt?: AppOption) => {
    match([opt, isInAppsRoute])
      .with([{type: 'app'}, false], ([app]: [AppOption, boolean]) => {
        router.push(formatRoute(Route.appDashboard(app.id)));
        setCurrentApp(O.some(app as Application));
      })
      .with([{type: 'app'}, true], ([app]: [AppOption, boolean]) => {
        setCurrentApp(O.some(app as Application));
      })
      .otherwise(noOp);
  };

  // TODO: clean this up
  useEffect(
    () => {
      if (!RD.isSuccess(apps)) {
        setApps(RD.loading);
      }

      const run = pipe(
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
      );

      run();
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
                  <Breadcrumbs />

                  <h1 className="mt-4 text-3xl font-semibold text-gray-700">
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

type Breadcrumb = {
  name: string;
  href: Route;
};

const getPages = (app: Application, current: Route): Breadcrumb[] =>
  A.cons({name: app.name, href: Route.appDashboard(app.id)})(
    pipe(
      current,
      matchRouteP({
        __: () => [],

        AppEndpoints: () => [
          {name: 'Endpoints', href: Route.appEndpoints(app.id, false)},
        ],
        AppSubs: () => [{name: 'Subscriptions', href: Route.appSubs(app.id)}],
        AppLogs: () => [{name: 'Logs', href: Route.appLogs(app.id)}],
      }),
    ),
  );

const Breadcrumbs = () => {
  const route = useCurrentRoute();
  const [currentApp, _setCurrentApp] = useAtom(SelectedAppAtom);

  const pages = pipe(
    currentApp,
    O.map((app) => getPages(app, route)),
    O.getOrElse((): Breadcrumb[] => []),
  );

  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol role="list" className="flex items-center space-x-4">
        <li>
          <div>
            <UnstyledLink
              href={Route.dashboard}
              className="text-gray-400 hover:text-gray-500"
            >
              <HomeIcon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              <span className="sr-only">Home</span>
            </UnstyledLink>
          </div>
        </li>
        {pipe(
          A.init(pages),
          O.getOrElse((): Breadcrumb[] => []),
          (init) =>
            init.map((page) => (
              <li key={page.name}>
                <div className="flex items-center">
                  <svg
                    className="h-5 w-5 flex-shrink-0 text-gray-300"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                  </svg>
                  <UnstyledLink
                    href={page.href}
                    className="ml-4 text-xs font-medium text-gray-500 hover:text-gray-700"
                  >
                    {page.name}
                  </UnstyledLink>
                </div>
              </li>
            )),
        )}

        {pipe(
          pages,
          A.last,
          O.match(
            () => null,
            ({name}) => (
              <li key={name}>
                <div className="flex items-center">
                  <svg
                    className="h-5 w-5 flex-shrink-0 text-gray-300"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                  </svg>
                  <div className="ml-4 text-xs font-medium text-gray-700">
                    {name}
                  </div>
                </div>
              </li>
            ),
          ),
        )}
      </ol>
    </nav>
  );
};
