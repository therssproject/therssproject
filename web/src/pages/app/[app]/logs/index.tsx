import * as A from 'fp-ts/Array';
import {pipe} from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import React from 'react';
import * as RD from 'remote-data-ts';

import {useAtom} from '@/lib/jotai';

import {Alert} from '@/components/Alert';
import {Layout} from '@/components/layout/Layout';
import {Skeleton} from '@/components/Skeleton';

import {LogItem} from '@/features/LogItem';
import {SelectedAppAtom} from '@/models/application';
import {AppLogsAtom} from '@/models/log';
import {NextPageWithLayout} from '@/pages/_app';

const AppLogs: NextPageWithLayout = () => {
  const [currentApp, _setCurrentApp] = useAtom(SelectedAppAtom);
  const [appLogs, _setLogs] = useAtom(AppLogsAtom);

  // TODO: currentApp to RemoteData and then sequence
  return pipe(
    currentApp,
    O.match(
      () => null,
      (_app) =>
        pipe(
          appLogs,
          RD.match({
            notAsked: () => <Skeleton className="h-48 w-full rounded-lg" />,
            loading: () => <Skeleton className="h-48 w-full rounded-lg" />,
            success: (logs) =>
              pipe(
                logs,
                A.match(
                  () => <Alert>No logs received yet ...</Alert>,
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
            failure: (msg) => (
              <div className="rounded-lg bg-red-50 p-4">{msg}</div>
            ),
          }),
        ),
    ),
  );
};

AppLogs.getLayout = (page) => (
  <Layout variant="applications" title="Logs" seo={{}}>
    {page}
  </Layout>
);

export default AppLogs;
