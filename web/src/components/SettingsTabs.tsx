import {
  CurrencyDollarIcon,
  ExclamationCircleIcon,
  KeyIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import * as A from 'fp-ts/Array';
import {pipe} from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import {useRouter} from 'next/router';

import {clsxm} from '@/lib/clsxm';
import {noOp} from '@/lib/effect';
import {Route} from '@/lib/routes';
import {format} from '@/lib/routes';
import {useCurrentRoute} from '@/lib/routing';

import {UnstyledLink} from '@/components/links/UnstyledLink';

const getTabs = (app: string) => [
  {
    name: 'Keys',
    Icon: KeyIcon,
    href: Route.appSettingsKeys(app),
    disabled: false,
  },
  {
    name: 'Members',
    Icon: UserGroupIcon,
    href: Route.appSettingsMembers(app),
    disabled: true,
  },
  {
    name: 'Billing',
    Icon: CurrencyDollarIcon,
    href: Route.appSettingsBilling(app),
    disabled: true,
  },
  {
    name: 'Advanced',
    Icon: ExclamationCircleIcon,
    href: Route.appSettingsAdvanced(app),
    disabled: false,
  },
];

export const Tabs = ({app}: {app: string}) => {
  const tabs = getTabs(app);
  const currentRoute = useCurrentRoute();
  const router = useRouter();

  return (
    <div>
      <div className="sm:hidden">
        <label htmlFor="tabs" className="sr-only">
          Select a tab
        </label>
        <select
          id="tabs"
          name="tabs"
          className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
          defaultValue={
            tabs.find((tab) => tab.href.tag === currentRoute.tag)?.name
          }
          onChange={(e) => {
            const {value} = e.target;

            pipe(
              tabs,
              A.findFirst((t) => t.href.tag === value),
              O.map((t) => format(t.href)),
              O.match(noOp, (path) => router.push(path)),
            );
          }}
        >
          {tabs.map((tab) => (
            <option key={tab.name} value={tab.href.tag}>
              {tab.name}
            </option>
          ))}
        </select>
      </div>
      <div className="hidden sm:block">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <UnstyledLink
                key={tab.name}
                href={tab.href}
                className={clsxm(
                  tab.href.tag === currentRoute.tag
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                  'flex items-center space-x-2 whitespace-nowrap border-b-2 py-4 px-2 text-sm font-medium',
                )}
                aria-current={
                  tab.href.tag === currentRoute.tag ? 'page' : undefined
                }
              >
                <tab.Icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </UnstyledLink>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
};
