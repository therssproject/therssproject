import {ArrowSmDownIcon, ArrowSmUpIcon} from '@heroicons/react/solid';
import {pipe} from 'fp-ts/function';
import * as O from 'fp-ts/Option';

import {useAtom} from '@/lib/jotai';

import {Layout} from '@/components/layout/Layout';
import {Skeleton} from '@/components/Skeleton';

import {SelectedAppAtom} from '@/models/application';
import {NextPageWithLayout} from '@/pages/_app';

const AppDashboard: NextPageWithLayout = () => {
  const [currentApp, _setCurrentApp] = useAtom(SelectedAppAtom);

  return pipe(
    currentApp,
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
  {
    name: 'Total subsciptions',
    stat: '71,897',
    previousStat: '70,946',
    change: '12%',
    changeType: 'increase',
  },
  {
    name: 'Total events',
    stat: '58,160,000',
    previousStat: '56,140,000',
    change: '2.02%',
    changeType: 'increase',
  },
  {name: 'Sync time', stat: '4 min'},
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

function TopCardsStats() {
  return (
    <div>
      <dl className="mt-5 grid grid-cols-1 divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow md:grid-cols-3 md:divide-y-0 md:divide-x">
        {stats.map((item) => (
          <div key={item.name} className="px-4 py-5 sm:p-6">
            <dt className="text-base font-normal text-gray-900">{item.name}</dt>
            <dd className="mt-1 flex items-baseline justify-between md:block lg:flex">
              <div className="flex items-baseline text-2xl font-semibold text-indigo-600">
                {item.stat}
                {item.previousStat && (
                  <span className="ml-2 text-sm font-medium text-gray-500">
                    from {item.previousStat}
                  </span>
                )}
              </div>

              {item.previousStat && (
                <div
                  className={classNames(
                    item.changeType === 'increase'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800',
                    'inline-flex items-baseline rounded-full px-2.5 py-0.5 text-sm font-medium md:mt-2 lg:mt-0',
                  )}
                >
                  {item.changeType === 'increase' ? (
                    <ArrowSmUpIcon
                      className="-ml-1 mr-0.5 h-5 w-5 flex-shrink-0 self-center text-green-500"
                      aria-hidden="true"
                    />
                  ) : (
                    <ArrowSmDownIcon
                      className="-ml-1 mr-0.5 h-5 w-5 flex-shrink-0 self-center text-red-500"
                      aria-hidden="true"
                    />
                  )}
                  <span className="sr-only">
                    {item.changeType === 'increase' ? 'Increased' : 'Decreased'}{' '}
                    by
                  </span>
                  {item.change}
                </div>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default AppDashboard;
