import {MenuIcon} from '@heroicons/react/outline';
import * as A from 'fp-ts/Array';
import * as E from 'fp-ts/Either';
import {pipe} from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import * as t from 'io-ts';
import {useRouter} from 'next/router';
import {ReactNode, useState} from 'react';
import * as RD from 'remote-data-ts';
import {match} from 'ts-pattern';

import * as http from '@/lib/fetch';
import {useAtom} from '@/lib/jotai';
import {format as formatRoute, Route} from '@/lib/routes';
import {useAsyncEffect} from '@/lib/useAsyncEffect';

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
import {SessionAtom} from '@/models/user';

type Props = {
  title: string;
  children: ReactNode;
  seo?: SeoProps;
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noOp = () => {};

export const Dashboard = ({title, children, seo}: Props) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  const [session, setSession] = useAtom(SessionAtom);
  const [apps, setApps] = useAtom(AppsAtom);

  const [option, setOption] = useState<AppOption | undefined>();

  useAsyncEffect(async () => {
    setApps(RD.loading);

    pipe(
      await http.get('/applications', t.array(Application))(),
      E.match(
        () => setApps(RD.failure('Failed to fetch')),
        (res) => {
          setApps(RD.success(res));

          pipe(
            res,
            A.head,
            O.filter(() => Boolean(!option)),
            O.map(appToOption),
            O.getOrElseW(() => undefined),
            setOption,
          );
        },
      ),
    );
  }, []);

  const onSelect = (opt?: AppOption) => {
    setOption(opt);

    match(opt)
      .with({type: 'app'}, (app) => {
        router.push(formatRoute(Route.appDashboard(app.id)));
      })
      .otherwise(noOp);
  };

  const appSelector = {
    // TODO: use derived atom?
    options: pipe(
      apps,
      RD.map(A.map(appToOption)),
      RD.map((res) => res.concat(SOON)),
      RD.toOption,
      O.getOrElse((): AppOption[] => []),
    ),
    selected: option,
    onSelect,
    disabled: !RD.isSuccess(apps),
  };

  return pipe(
    session,
    O.match(
      () => null,
      ({user}) => (
        <div className="mx-auto w-full max-w-screen-2xl">
          <Seo {...seo} />

          <Sidebar
            isOpen={sidebarOpen}
            user={user}
            onOpen={() => setSidebarOpen(true)}
            onClose={() => setSidebarOpen(false)}
            onLogout={() => setSession(O.none)}
            appSelector={appSelector}
          />
          <div className="flex flex-1 flex-col md:pl-64">
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
