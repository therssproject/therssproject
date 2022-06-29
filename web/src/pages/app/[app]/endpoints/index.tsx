import {PlusIcon} from '@heroicons/react/solid';
import * as A from 'fp-ts/Array';
import {pipe} from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import {useRouter} from 'next/router';
import {useEffect, useState} from 'react';
import * as RD from 'remote-data-ts';

import {useAtom} from '@/lib/jotai';
import {format as formatRoute, Route} from '@/lib/routes';
import {useRouteOfType} from '@/lib/routing';

import {Button} from '@/components/buttons/Button';
import {Layout} from '@/components/layout/Layout';
import {Skeleton} from '@/components/Skeleton';

import {Create} from '@/features/CreateEndpoint';
import {EndpointItem} from '@/features/EndpointItem';
import {SelectedAppAtom} from '@/models/application';
import {AppEndpointsAtom} from '@/models/endpoint';
import {NextPageWithLayout} from '@/pages/_app';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noOp = () => {};

const AppEndpoints: NextPageWithLayout = () => {
  const route = useRouteOfType('AppEndpoints');
  const router = useRouter();
  const [currentApp, _setCurrentApp] = useAtom(SelectedAppAtom);
  const [appEndpoints, _setEndpoints] = useAtom(AppEndpointsAtom);
  const [showForm, setShowForm] = useState(() =>
    Boolean(O.toUndefined(route)?.create),
  );

  const onOpen = () => setShowForm(true);

  // Clear the `?create=true` from the URL
  useEffect(
    () => {
      pipe(
        route,
        O.filter((r) => r.create),
        O.match(noOp, (route) => {
          router.replace(formatRoute(Route.appEndpoints(route.app, false)));
        }),
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return pipe(
    currentApp,
    O.match(
      () => null,
      (app) => (
        <div className="space-y-8">
          <Create
            app={app.id}
            open={showForm}
            onClose={() => setShowForm(false)}
          />

          <div className="flex w-full justify-end">
            <Button onClick={onOpen}>
              <PlusIcon className="h-4 w-4" /> Add endpoint
            </Button>
          </div>

          {pipe(
            appEndpoints,
            RD.match({
              notAsked: () => <Skeleton className="h-48 w-full rounded-lg" />,
              loading: () => <Skeleton className="h-48 w-full rounded-lg" />,
              success: (endpoints) =>
                pipe(
                  endpoints,
                  A.match(
                    () => (
                      <div className="rounded-lg bg-yellow-50 p-4 text-gray-700">
                        No endpoints created yet ...
                      </div>
                    ),
                    (endpoints) => (
                      <div className="overflow-hidden bg-white shadow sm:rounded-md">
                        <ul role="list" className="divide-y divide-gray-200">
                          {endpoints.map((endpoint) => (
                            <EndpointItem
                              key={endpoint.id}
                              endpoint={endpoint}
                            />
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
          )}
        </div>
      ),
    ),
  );
};

AppEndpoints.getLayout = (page) => (
  <Layout
    variant="applications"
    title="Endpoints"
    seo={{
      templateTitle: 'Components',
      description: 'Pre-built components with awesome default',
    }}
  >
    {page}
  </Layout>
);

export default AppEndpoints;
