import {PlusIcon} from '@heroicons/react/solid';
import * as A from 'fp-ts/Array';
import {pipe} from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import * as TE from 'fp-ts/TaskEither';
import {useRouter} from 'next/router';
import {useEffect, useState} from 'react';
import * as RD from 'remote-data-ts';

import {useAtom} from '@/lib/jotai';
import {format as formatRoute, Route} from '@/lib/routes';
import {useRouteOfType} from '@/lib/routing';

import {Alert} from '@/components/Alert';
import {Button} from '@/components/buttons/Button';
import {Layout} from '@/components/layout/Layout';
import {Skeleton} from '@/components/Skeleton';
import {SlideOver} from '@/components/SlideOver';
import {Terminal} from '@/components/Terminal';
import {useToast} from '@/components/Toast';

import {Create, Edit} from '@/features/CreateEndpoint';
import {EndpointItem} from '@/features/EndpointItem';
import {SelectedAppAtom} from '@/models/application';
import {AppEndpointsAtom, deleteEndpoint, Endpoint} from '@/models/endpoint';
import {NextPageWithLayout} from '@/pages/_app';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noOp = () => {};

type FormState =
  | {tag: 'hide'}
  | {tag: 'create'}
  | {tag: 'edit'; endpoint: Endpoint};

const hide: FormState = {tag: 'hide'};
const create: FormState = {tag: 'create'};

const AppEndpoints: NextPageWithLayout = () => {
  const toast = useToast();
  const route = useRouteOfType('AppEndpoints');
  const router = useRouter();
  const [currentApp, _setCurrentApp] = useAtom(SelectedAppAtom);
  const [appEndpoints, setEndpoints] = useAtom(AppEndpointsAtom);
  const [formState, setFormState] = useState<FormState>(() =>
    pipe(
      route,
      O.filter((route) => route.create),
      O.match(
        (): FormState => hide,
        () => create,
      ),
    ),
  );

  const openCreateForm = () => {
    if (formState.tag === 'hide') {
      setFormState(create);
    }
  };

  const openEditForm = (endpoint: Endpoint) => {
    if (formState.tag === 'hide') {
      setFormState({tag: 'edit', endpoint});
    }
  };

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

  const onDeleteEndpoint = (toDelete: Endpoint) => {
    pipe(
      appEndpoints,
      RD.map(A.filter((e) => e.id !== toDelete.id)),
      setEndpoints,
    );

    const run = pipe(
      deleteEndpoint(toDelete.application, toDelete.id),
      TE.match(
        () => toast.showUnique(toDelete.id, 'Endpoint deleted successfully'),
        () => {
          pipe(
            appEndpoints,
            RD.map((rest) => A.snoc(rest, toDelete)),
            setEndpoints,
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
          <SlideOver
            open={formState.tag !== 'hide'}
            onClose={() => setFormState(hide)}
          >
            {
              // To keep the slide out animation working, we have to render something.
              // So we default to the Create form even when Edit is being closed
              // TODO: this results in a flash of content changing from "Edit"
              //       to "Create" as the slide out animation play.
              //       Should we make the `Endpoint` optional in the edit form
              //       instead?
              formState.tag === 'edit' ? (
                <Edit
                  app={app.id}
                  endpoint={formState.endpoint}
                  onClose={() => setFormState(hide)}
                />
              ) : (
                <Create app={app.id} onClose={() => setFormState(hide)} />
              )
            }
          </SlideOver>

          <div className="flex w-full justify-end">
            <Button onClick={openCreateForm}>
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
                    () => <Alert>No endpoints created yet ...</Alert>,
                    (endpoints) => (
                      <div className="space-y-8">
                        <div className="overflow-hidden bg-white shadow sm:rounded-md">
                          <ul role="list" className="divide-y divide-gray-200">
                            {endpoints.map((endpoint) => (
                              <EndpointItem
                                key={endpoint.id}
                                endpoint={endpoint}
                                onDelete={onDeleteEndpoint}
                                onEdit={openEditForm}
                              />
                            ))}
                          </ul>
                        </div>

                        <div className="space-y-4 bg-white px-4 py-4 shadow sm:rounded-md sm:px-6">
                          <h2 className="text-xl font-medium text-gray-800">
                            Endpoints docs
                          </h2>

                          <p className="text-md text-gray-700">
                            Create create subscriptions to your endpoints
                          </p>
                          <Terminal>
                            {`curl https://api.therssproject.com/applications/add \\\n--data '{"endpoint": "asdf-1234-ghjk-5678", "url": "https://www.reddit.com/.rss"}'`}
                          </Terminal>
                        </div>
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
