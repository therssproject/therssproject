import {ViewListIcon} from '@heroicons/react/outline';
import {sequenceT} from 'fp-ts/Apply';
import * as A from 'fp-ts/Array';
import {pipe} from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import React, {useEffect} from 'react';
import * as RD from 'remote-data-ts';

import {useAtom} from '@/lib/jotai';
import {Route} from '@/lib/routes';

import {Layout} from '@/components/layout/Layout';
import {PrimaryLink} from '@/components/links/PrimaryLink';
import {Skeleton} from '@/components/Skeleton';

import {LogItem} from '@/features/LogItem';
import {
  Application,
  SelectedAppAtom,
  useRefetchAppData,
} from '@/models/application';
import {AppLogsAtom} from '@/models/log';
import {NextPageWithLayout} from '@/pages/_app';

const AppLogs: NextPageWithLayout = () => {
  const [currentApp, _setCurrentApp] = useAtom(SelectedAppAtom);
  const [appLogs, _setLogs] = useAtom(AppLogsAtom);
  const {refetchAppData} = useRefetchAppData();

  useEffect(
    () => {
      refetchAppData();

      // TODO: only trigger the logs re-fetch on the interval (useSWR?)
      const i = setInterval(() => {
        refetchAppData();
      }, 5000);

      return () => {
        clearInterval(i);
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const rdApp = pipe(
    currentApp,
    O.match((): RD.RemoteData<string, Application> => RD.notAsked, RD.success),
  );

  return pipe(
    sequenceT(RD.Apply)(rdApp, appLogs),
    RD.match({
      notAsked: () => <Skeleton className="h-48 w-full rounded-lg" />,
      loading: () => <Skeleton className="h-48 w-full rounded-lg" />,
      success: ([app, logs]) =>
        pipe(
          logs,
          A.match(
            () => <EmptyState app={app.id} />,
            (logs) => (
              <div className="overflow-hidden bg-white shadow sm:rounded-md">
                <ul role="list" className="divide-y divide-gray-200">
                  {logs.map((log) => (
                    <LogItem key={log.id} log={log} />
                  ))}
                </ul>
              </div>
            ),
          ),
        ),
      failure: (msg) => <div className="rounded-lg bg-red-50 p-4">{msg}</div>,
    }),
  );
};

const EmptyState = ({app}: {app: string}) => (
  <div className="mt-16">
    <div className="text-center">
      <ViewListIcon className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">
        No webhook events sent yet
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        Webhook events will show here once new entries are added
        <br />
        to your feed{' '}
        <PrimaryLink href={Route.appSubs(app)}>Subscriptions</PrimaryLink>.
      </p>
    </div>
  </div>
);

AppLogs.getLayout = (page) => (
  <Layout variant="applications" title="Logs" seo={{}}>
    {page}
  </Layout>
);

export default AppLogs;
