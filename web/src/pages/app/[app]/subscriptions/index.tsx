import {PlusIcon} from '@heroicons/react/solid';
import * as A from 'fp-ts/Array';
import {pipe} from 'fp-ts/function';
import * as NEA from 'fp-ts/NonEmptyArray';
import * as O from 'fp-ts/Option';
import * as TE from 'fp-ts/TaskEither';
import {useState} from 'react';
import * as RD from 'remote-data-ts';

import {useAtom} from '@/lib/jotai';
import {Route} from '@/lib/routes';

import {Button} from '@/components/buttons/Button';
import {Layout} from '@/components/layout/Layout';
import {PrimaryLink} from '@/components/links/PrimaryLink';
import {Skeleton} from '@/components/Skeleton';
import {useToast} from '@/components/Toast';

import {Create} from '@/features/CreateSub';
import {SubscriptionItem} from '@/features/SubscriptionItem';
import {SelectedAppAtom} from '@/models/application';
import {AppEndpointsAtom} from '@/models/endpoint';
import {
  AppSubscriptionsAtom,
  deleteSubscription,
  Subscription,
} from '@/models/subscription';
import {NextPageWithLayout} from '@/pages/_app';

const AppSubs: NextPageWithLayout = () => {
  const toast = useToast();
  const [currentApp, _setCurrentApp] = useAtom(SelectedAppAtom);
  const [appEndpoints] = useAtom(AppEndpointsAtom);
  const [appSubscriptions, setSubscriptions] = useAtom(AppSubscriptionsAtom);
  const [showForm, setShowForm] = useState(false);

  const onOpen = () => setShowForm(true);

  const onDeleteSubscription = (toDelete: Subscription) => {
    pipe(
      appSubscriptions,
      RD.map(A.filter((e) => e.id !== toDelete.id)),
      setSubscriptions,
    );

    const run = pipe(
      deleteSubscription(toDelete.application, toDelete.id),
      TE.match(
        () =>
          toast.showUnique(toDelete.id, 'Subscription deleted successfully'),
        () => {
          pipe(
            appSubscriptions,
            RD.map((rest) => A.snoc(rest, toDelete)),
            setSubscriptions,
          );
        },
      ),
    );

    run();
  };

  return pipe(
    currentApp,
    O.match(
      () => null,
      (app) => (
        <div className="space-y-8">
          {pipe(
            appEndpoints,
            RD.toOption,
            O.chain(NEA.fromArray),
            O.match(
              () => (
                <div className="flex w-full justify-end">
                  <div className="pb-4 text-gray-600">
                    No endpoints created yet, please{' '}
                    <PrimaryLink href={Route.appEndpoints(app.id, true)}>
                      add an endpoint
                    </PrimaryLink>{' '}
                    first.
                  </div>
                </div>
              ),
              (endpoints) => (
                <>
                  <Create
                    app={app.id}
                    endpoints={endpoints}
                    open={showForm}
                    onClose={() => setShowForm(false)}
                  />

                  <div className="flex w-full justify-end">
                    <Button onClick={onOpen}>
                      <PlusIcon className="h-4 w-4" /> Add subscription
                    </Button>
                  </div>
                </>
              ),
            ),
          )}

          {pipe(
            appSubscriptions,
            RD.match({
              notAsked: () => <Skeleton className="h-48 w-full rounded-lg" />,
              loading: () => <Skeleton className="h-48 w-full rounded-lg" />,
              success: (subscription) =>
                pipe(
                  subscription,
                  A.match(
                    () => (
                      <div className="rounded-lg bg-yellow-50 p-4 text-gray-700">
                        No subscriptions created yet ...
                      </div>
                    ),
                    (subscription) => (
                      <div className="overflow-hidden bg-white shadow sm:rounded-md">
                        <ul role="list" className="divide-y divide-gray-200">
                          {subscription.map((subscription) => (
                            <SubscriptionItem
                              key={subscription.id}
                              subscription={subscription}
                              onDelete={onDeleteSubscription}
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
