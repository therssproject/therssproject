import * as A from 'fp-ts/Array';
import {pipe} from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import * as TE from 'fp-ts/TaskEither';
import {useState} from 'react';
import * as RD from 'remote-data-ts';

import {useAtom} from '@/lib/jotai';

import {Button} from '@/components/buttons/Button';
import {Layout} from '@/components/layout/Layout';
import {Tabs} from '@/components/SettingsTabs';
import {Skeleton} from '@/components/Skeleton';

import {Create} from '@/features/CreateKey';
import {SelectedAppAtom, useFetchOnAppChange} from '@/models/application';
import {AppKeysAtom, fetchKeys} from '@/models/key';
import {NextPageWithLayout} from '@/pages/_app';

const AppSettingsKeys: NextPageWithLayout = () => {
  const [currentApp, _setCurrentApp] = useAtom(SelectedAppAtom);
  const [keys, setKeys] = useAtom(AppKeysAtom);
  const [newKeyOpen, setNewKeyOpen] = useState(false);

  useFetchOnAppChange(
    (app) =>
      pipe(
        fetchKeys(app.id),
        TE.mapLeft(() => 'Failed to load keys'),
      ),
    currentApp,
    keys,
    setKeys,
  );

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
                    application.
                  </p>
                </div>

                <Create
                  app={app}
                  open={newKeyOpen}
                  onClose={() => setNewKeyOpen(false)}
                />

                <div className="flex justify-end">
                  <Button onClick={() => setNewKeyOpen(true)}>
                    Generate new key
                  </Button>
                </div>

                <div className="space-y-3">
                  {pipe(
                    keys,
                    RD.match({
                      notAsked: () => (
                        <>
                          <Skeleton className="h-6 w-1/2 rounded-md" />
                          <Skeleton className="h-6 w-2/3 rounded-md" />
                          <Skeleton className="h-6 w-3/5 rounded-md" />
                        </>
                      ),
                      loading: () => (
                        <>
                          <Skeleton className="h-6 w-1/2 rounded-md" />
                          <Skeleton className="h-6 w-2/3 rounded-md" />
                          <Skeleton className="h-6 w-3/5 rounded-md" />
                        </>
                      ),
                      success: (keys) => (
                        <>
                          {pipe(
                            keys,
                            A.match(
                              () => (
                                <div className="rounded-lg bg-yellow-50 p-4 text-gray-700">
                                  No keys created yet ...
                                </div>
                              ),
                              (keys) => (
                                <>
                                  {keys.map((key) => (
                                    <div key={key.key}>
                                      {key.title} / {key.key.slice(0, 10)}
                                    </div>
                                  ))}
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

// TODO: move the `useCurrentApp()` logic to the layout to be able to show the title?
AppSettingsKeys.getLayout = (page) => (
  <Layout
    variant="applications"
    title="Settings"
    seo={{
      templateTitle: 'Components',
      description: 'Pre-built components with awesome default',
    }}
  >
    {page}
  </Layout>
);

export default AppSettingsKeys;
