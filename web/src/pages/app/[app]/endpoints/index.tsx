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

import {Button} from '@/components/buttons/Button';
import {Layout} from '@/components/layout/Layout';
import {PrimaryLink} from '@/components/links/PrimaryLink';
import {Skeleton} from '@/components/Skeleton';
import {SlideOver} from '@/components/SlideOver';
import {Terminal} from '@/components/Terminal';
import {useToast} from '@/components/Toast';

import * as SNIPPETS from '@/content/snippets';
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
        <>
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
          <div className="space-y-8">
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
                        <EmptyState
                          app={app.id}
                          openCreateForm={openCreateForm}
                        />
                      ),

                      (endpoints) => (
                        <>
                          <div className="flex w-full justify-end">
                            <Button onClick={openCreateForm}>
                              <PlusIcon className="h-4 w-4" /> Register endpoint
                            </Button>
                          </div>

                          <div className="overflow-hidden bg-white shadow sm:rounded-md">
                            <ul
                              role="list"
                              className="divide-y divide-gray-200"
                            >
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

                          <div className="space-y-8"></div>
                        </>
                      ),
                    ),
                  ),
                failure: (msg) => (
                  <div className="rounded-lg bg-red-50 p-4">{msg}</div>
                ),
              }),
            )}
          </div>
        </>
      ),
    ),
  );
};

const EmptyState = ({
  app,
  openCreateForm,
}: {
  app: string;
  openCreateForm: () => void;
}) => (
  <div className="mt-16 space-y-10">
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
      <h3 className="mt-2 text-sm font-medium text-gray-900">No endpoints</h3>
      <p className="mt-1 text-sm text-gray-500">
        Get started by registering a new endpoint.
      </p>
      <div className="mt-6">
        <Button onClick={openCreateForm}>
          <PlusIcon className="h-4 w-4" /> Register endpoint
        </Button>
      </div>
    </div>

    <div className="text-center text-gray-500">OR</div>

    <div className="flex flex-col items-center space-y-4 px-4 py-4 sm:px-6">
      <p className="text-md text-gray-600">Using the API</p>
      <Terminal>{SNIPPETS.createEndpoint}</Terminal>
      <p className="text-sm text-gray-600">
        Go to{' '}
        <PrimaryLink href={Route.appSettingsKeys(app)}>
          Settings {'>'} Keys
        </PrimaryLink>{' '}
        to create API Keys for this application.
      </p>
    </div>
  </div>
);

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
