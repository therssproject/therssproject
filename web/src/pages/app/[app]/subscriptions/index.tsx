import {
  CalendarIcon,
  LocationMarkerIcon,
  PlusIcon,
  UsersIcon,
} from '@heroicons/react/solid';
import * as A from 'fp-ts/Array';
import * as Eq from 'fp-ts/Eq';
import {pipe} from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import * as TE from 'fp-ts/TaskEither';
import {useStableEffect} from 'fp-ts-react-stable-hooks';
import {useState} from 'react';
import * as RD from 'remote-data-ts';

import {useAtom} from '@/lib/jotai';
import {Route} from '@/lib/routes';

import {Button} from '@/components/buttons/Button';
import {Layout} from '@/components/layout/Layout';
import {UnstyledLink} from '@/components/links/UnstyledLink';
import {Skeleton} from '@/components/Skeleton';

import {Create} from '@/features/CreateSub';
import {eqApplication, useCurrentApp} from '@/models/application';
import {AppEndpointsAtom} from '@/models/endpoint';
import {
  AppSubscriptionsAtom,
  fetchSubscriptions,
  Subscription,
} from '@/models/subscription';
import {NextPageWithLayout} from '@/pages/_app';

const AppSubs: NextPageWithLayout = () => {
  const currentApp = useCurrentApp();
  const [appEndpoints] = useAtom(AppEndpointsAtom);
  const [appSubscriptions, setSubscriptions] = useAtom(AppSubscriptionsAtom);
  const [showForm, setShowForm] = useState(false);

  const onOpen = () => setShowForm(true);

  useStableEffect(
    () => {
      const app = O.toUndefined(currentApp);

      if (!app) {
        return;
      }

      if (RD.isNotAsked(appSubscriptions) || RD.isFailure(appSubscriptions)) {
        setSubscriptions(RD.loading);
      }

      pipe(
        fetchSubscriptions(app.id),
        TE.match(
          (err) => {
            // eslint-disable-next-line no-console
            console.log(err);

            setSubscriptions(RD.failure('Failed to fetch endpoints'));
          },
          (endpoints) => {
            setSubscriptions(RD.success(endpoints));
          },
        ),
        (run) => run(),
      );
    },
    [currentApp],
    Eq.tuple(O.getEq(eqApplication)),
  );

  return pipe(
    currentApp,
    O.match(
      () => null,
      (app) => (
        <div className="space-y-8">
          <Create
            app={app.id}
            endpoints={pipe(appEndpoints, RD.toOption, O.toUndefined) ?? []}
            open={showForm}
            onClose={() => setShowForm(false)}
          />

          <div className="flex w-full justify-end">
            {/* TODO: only show if there are endpoints */}
            <Button onClick={onOpen}>
              <PlusIcon className="h-4 w-4" /> Add subscription
            </Button>
          </div>

          {pipe(
            appSubscriptions,
            RD.match({
              notAsked: () => <Skeleton className="h-48 w-full rounded-lg" />,
              loading: () => <Skeleton className="h-48 w-full rounded-lg" />,
              success: (endpoints) =>
                pipe(
                  endpoints,
                  A.match(
                    () => (
                      <div className="rounded-lg bg-yellow-50 p-4 text-gray-700">
                        No subscriptions created yet ...
                      </div>
                    ),
                    (endpoints) => (
                      <div className="overflow-hidden bg-white shadow sm:rounded-md">
                        <ul role="list" className="divide-y divide-gray-200">
                          {endpoints.map((endpoint) => (
                            <SubscriptionItem
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

// TODO: Subscription styles
const SubscriptionItem = ({endpoint}: {endpoint: Subscription}) => {
  return (
    <li>
      <UnstyledLink
        href={Route.appSubs(endpoint.application)}
        className="block hover:bg-gray-50"
      >
        <div className="px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <p className="truncate text-sm font-medium text-indigo-600">
              {endpoint.application}
            </p>
            <div className="ml-2 flex flex-shrink-0">
              <p className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                {endpoint.url}
              </p>
            </div>
          </div>
          <div className="mt-2 sm:flex sm:justify-between">
            <div className="sm:flex">
              <p className="flex items-center text-sm text-gray-500">
                <UsersIcon
                  className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400"
                  aria-hidden="true"
                />
                {endpoint.endpoint}
              </p>
              <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                <LocationMarkerIcon
                  className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400"
                  aria-hidden="true"
                />
                {endpoint.application}
              </p>
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
              <CalendarIcon
                className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400"
                aria-hidden="true"
              />
              <p>
                Closing on{' '}
                <time dateTime={endpoint.created_at}>
                  {new Date(endpoint.created_at).toLocaleString()}
                </time>
              </p>
            </div>
          </div>
        </div>
      </UnstyledLink>
    </li>
  );
};

AppSubs.getLayout = (page) => (
  <Layout
    variant="applications"
    title="Subscriptions"
    seo={{
      templateTitle: 'Components',
      description: 'Pre-built components with awesome default',
    }}
  >
    {page}
  </Layout>
);

export default AppSubs;
