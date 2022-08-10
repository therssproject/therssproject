import {KeyIcon} from '@heroicons/react/outline';
import * as A from 'fp-ts/Array';
import {pipe} from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import * as TE from 'fp-ts/TaskEither';
import {useState} from 'react';
import * as RD from 'remote-data-ts';

import * as crisp from '@/lib/crisp';
import {noOp} from '@/lib/effect';
import {useAtom} from '@/lib/jotai';
import {Route} from '@/lib/routes';

import {Button} from '@/components/buttons/Button';
import {Layout} from '@/components/layout/Layout';
import {PrimaryLink} from '@/components/links/PrimaryLink';
import {Tabs} from '@/components/SettingsTabs';
import {Skeleton} from '@/components/Skeleton';

import {Generate} from '@/features/CreateKey';
import {KeyItem} from '@/features/KeyItem';
import {SelectedAppAtom, useFetchOnAppChange} from '@/models/application';
import {AppKeysAtom, deleteKey, fetchKeys, Key} from '@/models/key';
import {NextPageWithLayout} from '@/pages/_app';

const AppSettingsKeys: NextPageWithLayout = () => {
  const [currentApp, _setCurrentApp] = useAtom(SelectedAppAtom);
  const [keys, setKeys] = useAtom(AppKeysAtom);
  const [newKeyOpen, setNewKeyOpen] = useState(false);

  const onOpen = () => {
    setNewKeyOpen(true);
    crisp.hide();
  };

  const onClose = () => {
    setNewKeyOpen(false);
    setTimeout(() => {
      crisp.show();
    }, 750);
  };

  useFetchOnAppChange(
    (app) =>
      pipe(
        fetchKeys(app.id),
        TE.map((res) => res.data),
        TE.mapLeft(() => 'Failed to load keys'),
      ),
    currentApp,
    keys,
    setKeys,
  );

  const onDeleteKey = (toDelete: Key) => {
    pipe(keys, RD.map(A.filter((e) => e.id !== toDelete.id)), setKeys);

    const run = pipe(
      deleteKey(toDelete.application, toDelete.id),
      TE.match(() => {
        pipe(
          keys,
          RD.map((rest) => A.snoc(rest, toDelete)),
          setKeys,
        );
      }, noOp),
    );

    run();
  };

  return pipe(
    currentApp,
    O.match(
      () => null,
      (app) => (
        <div className="space-y-8">
          <Tabs app={app.id} />

          <div className="mt-5 md:col-span-2 md:mt-0">
            <div className="shadow sm:overflow-hidden sm:rounded-md">
              <div className="space-y-8 bg-white px-4 py-5 sm:p-6">
                <div>
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    API Keys
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    These keys can be used to interact with the with the{' '}
                    <code>therssproject</code> API on behalf of this
                    application. See the{' '}
                    <PrimaryLink href={Route.documentation}>
                      documentation
                    </PrimaryLink>{' '}
                    for more information.
                  </p>
                </div>

                <Generate app={app} open={newKeyOpen} onClose={onClose} />

                <div className="space-y-3">
                  {pipe(
                    keys,
                    RD.match({
                      notAsked: () => (
                        <div className="mt-10 space-y-2">
                          <Skeleton className="h-16 w-full rounded-md" />
                          <Skeleton className="h-16 w-full rounded-md" />
                          <Skeleton className="h-16 w-full rounded-md" />
                        </div>
                      ),
                      loading: () => (
                        <div className="mt-10 space-y-2">
                          <Skeleton className="h-16 w-full rounded-md" />
                          <Skeleton className="h-16 w-full rounded-md" />
                          <Skeleton className="h-16 w-full rounded-md" />
                        </div>
                      ),
                      success: (keys) => (
                        <>
                          {pipe(
                            keys,
                            A.match(
                              () => <EmptyState openForm={onOpen} />,
                              (keys) => (
                                <>
                                  <div className="flex justify-end">
                                    <Button onClick={onOpen}>
                                      Generate new key
                                    </Button>
                                  </div>
                                  <div className="overflow-hidden border-gray-200 bg-white sm:rounded-md sm:border">
                                    <ul
                                      role="list"
                                      className="divide-y divide-gray-200"
                                    >
                                      {keys.map((key) => (
                                        <KeyItem
                                          key={key.id}
                                          key_={key}
                                          onDelete={onDeleteKey}
                                        />
                                      ))}
                                    </ul>
                                  </div>
                                </>
                              ),
                            ),
                          )}
                        </>
                      ),
                      failure: (msg) => (
                        <div className="rounded-lg bg-red-50 p-4">{msg}</div>
                      ),
                    }),
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
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
      <KeyIcon className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">No keys</h3>
      <p className="mt-1 text-sm text-gray-500">
        Generate a key to use the API.
      </p>
      <div className="mt-6">
        <Button onClick={openForm}>Generate an API key</Button>
      </div>
    </div>
  </div>
);

AppSettingsKeys.getLayout = (page) => (
  <Layout variant="applications" title="Settings" seo={{}}>
    {page}
  </Layout>
);

export default AppSettingsKeys;
