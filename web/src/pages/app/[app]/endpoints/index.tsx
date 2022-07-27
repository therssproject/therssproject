import * as A from 'fp-ts/Array';
import {pipe} from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import * as TE from 'fp-ts/TaskEither';
import {useState} from 'react';
import * as RD from 'remote-data-ts';

import {noOp} from '@/lib/effect';
import {useAtom} from '@/lib/jotai';

import {Button} from '@/components/buttons/Button';
import {Layout} from '@/components/layout/Layout';
import {Skeleton} from '@/components/Skeleton';
import {SlideOver} from '@/components/SlideOver';

import {Register, Update} from '@/features/CreateEndpoint';
import {EndpointItem} from '@/features/EndpointItem';
import {SelectedAppAtom} from '@/models/application';
import {AppEndpointsAtom, deleteEndpoint, Endpoint} from '@/models/endpoint';
import {NextPageWithLayout} from '@/pages/_app';

type FormState =
  | {tag: 'hide'}
  | {tag: 'register'}
  | {tag: 'update'; endpoint: Endpoint};

const hide: FormState = {tag: 'hide'};
const register: FormState = {tag: 'register'};

const AppEndpoints: NextPageWithLayout = () => {
  const [currentApp, _setCurrentApp] = useAtom(SelectedAppAtom);
  const [appEndpoints, setEndpoints] = useAtom(AppEndpointsAtom);
  const [formState, setFormState] = useState<FormState>(hide);

  const openForm = () => {
    if (formState.tag === 'hide') {
      setFormState(register);
    }
  };

  const openEditForm = (endpoint: Endpoint) => {
    if (formState.tag === 'hide') {
      setFormState({tag: 'update', endpoint});
    }
  };

  const onDeleteEndpoint = (toDelete: Endpoint) => {
    pipe(
      appEndpoints,
      RD.map(A.filter((e) => e.id !== toDelete.id)),
      setEndpoints,
    );

    const run = pipe(
      deleteEndpoint(toDelete.application, toDelete.id),
      TE.match(noOp, () => {
        pipe(
          appEndpoints,
          RD.map((rest) => A.snoc(rest, toDelete)),
          setEndpoints,
        );
      }),
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
              //       Should we make the `Endpoint` optional in the update form
              //       instead?
              formState.tag === 'update' ? (
                <Update
                  app={app.id}
                  endpoint={formState.endpoint}
                  onClose={() => setFormState(hide)}
                />
              ) : (
                <Register app={app.id} onClose={() => setFormState(hide)} />
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
                      () => <EmptyState openForm={openForm} />,

                      (endpoints) => (
                        <>
                          <div className="flex w-full justify-end">
                            <Button onClick={openForm}>
                              Register endpoint
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
      <h3 className="mt-2 text-sm font-medium text-gray-900">No endpoints</h3>
      <p className="mt-1 text-sm text-gray-500">
        Get started by registering a new endpoint.
      </p>
      <div className="mt-6">
        <Button onClick={openForm}>Register endpoint</Button>
      </div>
    </div>
  </div>
);

AppEndpoints.getLayout = (page) => (
  <Layout variant="applications" title="Endpoints" seo={{}}>
    {page}
  </Layout>
);

export default AppEndpoints;
