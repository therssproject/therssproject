import {pipe} from 'fp-ts/function';
import * as O from 'fp-ts/Option';

import {Layout} from '@/components/layout/Layout';
import {Skeleton} from '@/components/Skeleton';

import {useCurrentApp} from '@/models/application';
import {NextPageWithLayout} from '@/pages/_app';

const AppDashboard: NextPageWithLayout = () => {
  return pipe(
    useCurrentApp(),
    O.match(
      () => null,
      (_app) => (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-96 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      ),
    ),
  );
};

// TODO: move the `useCurrentApp()` logic to the layout to be able to show the title?
AppDashboard.getLayout = (page) => (
  <Layout
    variant="applications"
    title="Dashboard"
    seo={{
      templateTitle: 'Components',
      description: 'Pre-built components with awesome default',
    }}
  >
    {page}
  </Layout>
);

export default AppDashboard;
