import {PlusIcon} from '@heroicons/react/solid';
import * as A from 'fp-ts/Array';
import {pipe} from 'fp-ts/function';
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
import {AppEndpointsAtom, Endpoint} from '@/models/endpoint';
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
      (app) =>
        pipe(
          appSubscriptions,
          RD.match({
            notAsked: () => <Skeleton className="h-48 w-full rounded-lg" />,
            loading: () => <Skeleton className="h-48 w-full rounded-lg" />,
            success: (subscriptions) =>
              pipe(
                appEndpoints,
                RD.toOption,
                O.getOrElse((): Endpoint[] => []),
                A.match(
                  () => (
                    <div className="mt-16 flex w-full flex-col items-center space-y-2">
                      <p className="text-lg text-gray-600">
                        No endpoints registered yet.
                      </p>
                      <p className="text-lg text-gray-600">
                        Please{' '}
                        <PrimaryLink href={Route.appEndpoints(app.id)}>
                          register one
                        </PrimaryLink>{' '}
                        first.
                      </p>
                    </div>
                  ),
                  (es) => (
                    <>
                      <Create
                        app={app.id}
                        endpoints={es}
                        open={showForm}
                        onClose={() => setShowForm(false)}
                      />

                      {pipe(
                        subscriptions,
                        A.match(
                          () => <EmptyState openForm={onOpen} />,
                          (subs) => (
                            <div className="space-y-8">
                              <div className="flex w-full justify-end">
                                <Button onClick={onOpen}>
                                  <PlusIcon className="h-4 w-4" /> Create
                                  subscription
                                </Button>
                              </div>

                              <div className="overflow-hidden bg-white shadow sm:rounded-md">
                                <ul
                                  role="list"
                                  className="divide-y divide-gray-200"
                                >
                                  {subs.map((sub) => (
                                    <SubscriptionItem
                                      key={sub.id}
                                      subscription={sub}
                                      onDelete={onDeleteSubscription}
                                    />
                                  ))}
                                </ul>
                              </div>
                            </div>
                          ),
                        ),
                      )}
                    </>
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

type EmptyStateProps = {
  openForm: () => void;
};

const EmptyState = ({openForm}: EmptyStateProps) => (
  <div className="mt-16">
    <div className="text-center">
      <svg
        className="mx-auto h-12 w-12 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
        />
      </svg>
      <h3 className="mt-2 text-sm font-medium text-gray-900">
        No subscriptions
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        Get started by creating a new subscription.
      </p>
      <div className="mt-6">
        <Button onClick={openForm}>
          <PlusIcon className="h-4 w-4" /> Create subscription
        </Button>
      </div>
    </div>
  </div>
);

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
