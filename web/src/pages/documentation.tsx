import * as O from 'fp-ts/Option';
import {pipe} from 'fp-ts/function';
import {BeakerIcon} from '@heroicons/react/outline';

import {Alert} from '@/components/Alert';
import {Layout} from '@/components/layout/Layout';

import {Terminal} from '@/components/Terminal';
import {SelectedAppAtom} from '@/models/application';

import * as SNIPPETS from '@/content/snippets';
import {PrimaryLink} from '@/components/links/PrimaryLink';

import {Route} from '@/lib/routes';
import {useAtom} from '@/lib/jotai';

import {NextPageWithLayout} from './_app';

const Documentation: NextPageWithLayout = () => {
  const [currentApp, _setCurrentApp] = useAtom(SelectedAppAtom);

  return (
    <div className="space-y-8">
      <Alert variant="warning">
        <div className="flex">
          <BeakerIcon className="mr-2 h-8 w-8" />
          <div className="text-lg">Work in progress ...</div>
        </div>
      </Alert>

      <section className="space-y-4">
        <h3 className="text-xl font-medium text-gray-600">Register endpoint</h3>

        <Terminal>{SNIPPETS.registerEndpoint}</Terminal>

        <p className="text-sm text-gray-600">
          Go to{' '}
          {pipe(
            currentApp,
            O.match(
              () => <>settings to generate API Keys.</>,
              (app) => (
                <>
                  <PrimaryLink href={Route.appSettingsKeys(app.id)}>
                    Settings {'>'} Keys
                  </PrimaryLink>{' '}
                  to generate API Keys for this application.
                </>
              ),
            ),
          )}
        </p>
      </section>
    </div>
  );
};

Documentation.getLayout = (page) => (
  <Layout
    variant="dashboard"
    title="Documentation"
    goToAppOnLoad={false}
    seo={{
      templateTitle: 'Documentation',
      description: 'RSS docs',
    }}
  >
    {page}
  </Layout>
);

export default Documentation;
