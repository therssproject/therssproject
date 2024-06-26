import {BeakerIcon} from '@heroicons/react/24/outline';
import {pipe} from 'fp-ts/function';
import * as O from 'fp-ts/Option';

import {external} from '@/lib/href';
import {useAtom} from '@/lib/jotai';
import {Route} from '@/lib/routes';

import {Alert} from '@/components/Alert';
import {Footer} from '@/components/Footer';
import {Layout} from '@/components/layout/Layout';
import {ArrowLink} from '@/components/links/ArrowLink';
import {PrimaryLink} from '@/components/links/PrimaryLink';
import {Logo} from '@/components/Logo';
import {Terminal} from '@/components/Terminal';

import * as SNIPPETS from '@/content/snippets';
import {SelectedAppAtom} from '@/models/application';
import {useSession} from '@/models/user';

import {NextPageWithLayout} from './_app';

const Documentation: NextPageWithLayout = () => {
  const [currentApp, _setCurrentApp] = useAtom(SelectedAppAtom);
  const {session} = useSession();

  return (
    <div className="layout min-h-screen space-y-8 pt-10 pb-20">
      <div>
        <Logo />
        <h1 className="mt-6 text-gray-700">Documentation</h1>
        {pipe(
          session,
          O.match(
            () => (
              <ArrowLink
                direction="left"
                className="mt-2 text-gray-700"
                href={Route.index}
              >
                Back Home
              </ArrowLink>
            ),
            (_) => (
              <ArrowLink
                direction="left"
                className="mt-2 text-gray-700"
                href={Route.dashboard}
              >
                Back to Dashboard
              </ArrowLink>
            ),
          ),
        )}
      </div>

      <Alert variant="success">
        <p className="text-lg">
          Find examples and the full API documentation on{' '}
          <PrimaryLink
            href={external('https://github.com/therssproject/documentation')}
          >
            github.com/therssproject/documentation
          </PrimaryLink>
          .
        </p>
      </Alert>

      <Alert variant="warning">
        <div className="flex">
          <BeakerIcon className="mr-2 h-8 w-8" />
          <div className="text-lg">Work in progress ...</div>
        </div>
      </Alert>

      <section className="space-y-4">
        <h3 className="text-xl font-medium text-gray-600">Creating API Keys</h3>
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

      <section className="space-y-4">
        <h3 className="text-xl font-medium text-gray-600">Register endpoint</h3>

        <Terminal
          id="registerEndpoint"
          snippet={SNIPPETS.registerEndpoint}
          from="docs"
        />
      </section>

      <section className="space-y-4">
        <h3 className="text-xl font-medium text-gray-600">
          Subscribe to an RSS feed
        </h3>

        <Terminal
          id="createSubscription"
          snippet={SNIPPETS.createSubscription}
          from="docs"
        />
      </section>

      <section className="space-y-4">
        <h3 className="text-xl font-medium text-gray-600">Parse an RSS feed</h3>

        <Terminal id="parseFeed" snippet={SNIPPETS.parseFeed} from="docs" />
      </section>
    </div>
  );
};

Documentation.getLayout = (page) => (
  <Layout
    variant="clean"
    seo={{
      templateTitle: 'Documentation',
      description: 'Getting started guide',
    }}
  >
    {page}
    <Footer />
  </Layout>
);

export default Documentation;
