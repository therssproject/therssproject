import {clsxm} from '@/lib/clsxm';
import {Route} from '@/lib/routes';
import {useCurrentRoute} from '@/lib/routing';

import {UnstyledLink} from '@/components/links/UnstyledLink';

const getTabs = (app: string) => [
  {name: 'Keys', href: Route.appSettingsKeys(app), disabled: false},
  {name: 'Members', href: Route.appSettingsMembers(app), disabled: true},
];

export const Tabs = ({app}: {app: string}) => {
  const tabs = getTabs(app);
  const currentRoute = useCurrentRoute();

  return (
    <div>
      <div className="sm:hidden">
        <label htmlFor="tabs" className="sr-only">
          Select a tab
        </label>
        {/* Use an "onChange" listener to redirect the user to the selected tab URL. */}
        <select
          id="tabs"
          name="tabs"
          className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
          defaultValue={
            tabs.find((tab) => tab.href.tag === currentRoute.tag)?.name
          }
        >
          {tabs.map((tab) => (
            <option key={tab.name}>{tab.name}</option>
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
                  'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium',
                )}
                aria-current={
                  tab.href.tag === currentRoute.tag ? 'page' : undefined
                }
              >
                {tab.name}
              </UnstyledLink>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
};
