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
          <TopCardsStats />
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

const stats = [
  {name: 'Total subscriptions', stat: '71,897'},
  {name: 'Total events sent', stat: '341,032'},
  {name: 'Average sync time', stat: '3 min'},
];

function TopCardsStats() {
  return (
    <div>
      <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {stats.map((item) => (
          <div
            key={item.name}
            className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6"
          >
            <dt className="truncate text-sm font-medium text-gray-500">
              {item.name}
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {item.stat}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default AppDashboard;
