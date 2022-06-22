import {pipe} from 'fp-ts/function';
import * as O from 'fp-ts/Option';

import {useRouteOfType} from '@/lib/routing';

import {Layout} from '@/components/layout/Layout';

import {NextPageWithLayout} from '@/pages/_app';

const AppEndpoints: NextPageWithLayout = () => {
  const route = useRouteOfType('AppEndpoints');

  return (
    <div className="space-y-4">
      <div className="h-96 rounded-lg border-4 border-dashed border-gray-200">
        <div className="p-4">
          {pipe(
            route,
            O.match(
              () => <div>What? No app?</div>,
              ({app}) => <div>App {app}</div>,
            ),
          )}
        </div>
      </div>
    </div>
  );
};

AppEndpoints.getLayout = (page) => (
  <Layout
    variant="applications"
    title="Components"
    seo={{
      templateTitle: 'Components',
      description: 'Pre-built components with awesome default',
    }}
  >
    {page}
  </Layout>
);

export default AppEndpoints;
