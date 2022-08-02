import {Dialog, Transition} from '@headlessui/react';
import {
  ChatIcon,
  CogIcon,
  DocumentTextIcon,
  LinkIcon,
  LogoutIcon,
  RssIcon,
  ViewGridIcon,
  ViewListIcon,
  XIcon,
} from '@heroicons/react/outline';
import {ComponentType, FC, Fragment} from 'react';

import * as track from '@/lib/analytics/track';
import {clsxm} from '@/lib/clsxm';
import * as crisp from '@/lib/crisp';
import {Route, RouteTag} from '@/lib/routes';
import {useCurrentRoute} from '@/lib/routing';

import {Select} from '@/components/Select';
import {Skeleton} from '@/components/Skeleton';

import {AppOption} from '@/models/application';
import {PublicUser} from '@/models/user';

import {UnstyledLink} from './links/UnstyledLink';
import {Logo} from './Logo';

type NavLink = {
  name: string;
  href: Route;
  group: RouteTag[];
  icon: ComponentType<{className: string}>;
};

const navigation = (app: string): NavLink[] => [
  {
    name: 'Dashboard',
    icon: ViewGridIcon,
    href: Route.appDashboard(app),
    group: [],
  },
  {
    name: 'Endpoints',
    icon: LinkIcon,
    href: Route.appEndpoints(app),
    group: [],
  },
  {
    name: 'Subscriptions',
    icon: RssIcon,
    href: Route.appSubs(app),
    group: [],
  },
  {name: 'Logs', icon: ViewListIcon, href: Route.appLogs(app), group: []},
  {
    name: 'Settings',
    icon: CogIcon,
    href: Route.appSettingsGeneral(app),
    group: [
      'AppSettingsGeneral',
      'AppSettingsKeys',
      'AppSettingsMembers',
      'AppSettingsBilling',
    ],
  },
];

type SecondaryNavItem =
  | ({type: 'link'; onClick?: () => void} & NavLink)
  | {
      type: 'action';
      name: string;
      icon: ComponentType<{className: string}>;
      action: () => void;
    };

const secondaryNavigation = (
  email: string,
  onLogout: () => void,
): SecondaryNavItem[] => [
  {
    type: 'link',
    name: 'Documentation',
    icon: DocumentTextIcon,
    href: Route.documentation,
    onClick: track.openDocs,
    group: [],
  },
  {
    type: 'action',
    name: 'Chat with us',
    icon: ChatIcon,
    action: () => {
      crisp.setEmail(email);
      crisp.openChat();
    },
  },
  {
    type: 'action',
    name: 'Sign out',
    icon: LogoutIcon,
    action: onLogout,
  },
];

type Props = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onLogout: () => void;
  user: PublicUser;

  appSelector: {
    options: AppOption[];
    selected?: AppOption;
    onSelect: (opt?: AppOption) => void;
    disabled: boolean;
  };
};

export const Sidebar: FC<Props> = ({
  isOpen,
  onClose,
  onLogout,
  user,
  appSelector,
}) => {
  return (
    <>
      <Transition.Root show={isOpen} as={Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 z-40 flex md:hidden"
          onClose={onClose}
        >
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          </Transition.Child>
          <Transition.Child
            as={Fragment}
            enter="transition ease-in-out duration-300 transform"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white">
              <Transition.Child
                as={Fragment}
                enter="ease-in-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in-out duration-300"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="absolute top-0 right-0 -mr-12 pt-2">
                  <button
                    type="button"
                    className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close sidebar</span>
                    <XIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </button>
                </div>
              </Transition.Child>
              {/* ... */}
              <div className="h-0 flex-1 overflow-y-auto pt-5 pb-4">
                <div className="px-4">
                  <Logo />
                </div>
                <nav className="mt-5 space-y-2 px-2">
                  <MainNav app={appSelector.selected?.id} closeNav={onClose} />
                </nav>
              </div>
              <SecondaryNav
                email={user.email}
                onLogout={onLogout}
                closeNav={onClose}
              />
              <Profile username={user.name} />
            </div>
          </Transition.Child>
          <div className="w-14 flex-shrink-0">
            {/* Force sidebar to shrink to fit close icon */}
          </div>
        </Dialog>
      </Transition.Root>

      {/* Static sidebar for desktop */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        {/* Sidebar component, swap this element with another sidebar if you like */}
        <div className="flex flex-grow flex-col overflow-y-auto border-x border-gray-200 bg-white pt-5">
          <div className="px-4">
            <Logo />
          </div>
          <div className="mx-2 mt-5">
            <Select {...appSelector} />
          </div>
          <div className="mt-5 flex flex-grow flex-col">
            <nav
              className="flex-1 space-y-8 bg-white px-2"
              aria-label="Sidebar"
            >
              <div className="space-y-2">
                <MainNav app={appSelector.selected?.id} closeNav={onClose} />
              </div>
            </nav>
          </div>
          <SecondaryNav
            email={user.email}
            onLogout={onLogout}
            closeNav={onClose}
          />
          <Profile username={user.name} />
        </div>
      </div>
    </>
  );
};

const MainNav = ({app, closeNav}: {app?: string; closeNav: () => void}) => {
  const route = useCurrentRoute();

  return (
    <>
      {app ? (
        navigation(app)
          .map((item) => ({
            item,
            isActive:
              item.group.includes(route.tag) || item.href.tag === route.tag,
          }))
          .map(({item, isActive}) => (
            <UnstyledLink
              key={item.name}
              href={item.href}
              onClick={closeNav}
              className={clsxm(
                isActive
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                'group flex items-center rounded-md px-2 py-2 text-base font-medium',
              )}
            >
              <item.icon
                className={clsxm(
                  isActive
                    ? 'text-gray-500'
                    : 'text-gray-400 group-hover:text-gray-500',
                  'mr-4 h-6 w-6 flex-shrink-0',
                )}
                aria-hidden="true"
              />
              {item.name}
            </UnstyledLink>
          ))
      ) : (
        <>
          <Skeleton className="h-10 w-full rounded-md p-2" />
          <Skeleton className="h-10 w-full rounded-md p-2" />
          <Skeleton className="h-10 w-full rounded-md p-2" />
          <Skeleton className="h-10 w-full rounded-md p-2" />
        </>
      )}
    </>
  );
};

const SecondaryNav = ({
  email,
  onLogout,
  closeNav,
}: {
  email: string;
  onLogout: () => void;
  closeNav: () => void;
}) => {
  const route = useCurrentRoute();

  return (
    <div
      className="space-y-1 px-2"
      role="group"
      aria-labelledby="projects-headline"
    >
      {secondaryNavigation(email, onLogout).map((item) =>
        item.type === 'link' ? (
          <UnstyledLink
            key={item.name}
            href={item.href}
            onClick={() => {
              closeNav();
              if (item.onClick) {
                item.onClick();
              }
            }}
            className={clsxm(
              item.href.tag === route.tag
                ? 'bg-gray-100 text-gray-700'
                : 'text-gray-400 hover:bg-gray-50 hover:text-gray-700',
              'group flex items-center rounded-md px-2 py-2 text-base font-medium',
            )}
          >
            <item.icon
              className={clsxm(
                item.href.tag === route.tag
                  ? 'text-gray-600'
                  : 'text-gray-400 group-hover:text-gray-600',
                'mr-4 h-5 w-5 flex-shrink-0',
              )}
              aria-hidden="true"
            />
            {item.name}
          </UnstyledLink>
        ) : (
          <button
            key={item.name}
            onClick={() => {
              item.action();
              closeNav();
            }}
            className={clsxm(
              'text-gray-400 hover:bg-gray-50 hover:text-gray-700',
              'group flex w-full items-center rounded-md px-2 py-2 text-base font-medium',
            )}
          >
            <item.icon
              className={clsxm(
                'text-gray-400 group-hover:text-gray-600',
                'mr-4 h-5 w-5 flex-shrink-0',
              )}
              aria-hidden="true"
            />
            {item.name}
          </button>
        ),
      )}
    </div>
  );
};

const Profile = ({username, avatar}: {username: string; avatar?: string}) => (
  <div className="mt-4 flex flex-shrink-0 border-t border-gray-200 p-4">
    {/* TODO: profile route */}
    <UnstyledLink
      href={Route.notFound}
      className="group block w-full flex-shrink-0"
    >
      <div className="flex items-center">
        <div>
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="inline-block h-9 w-9 rounded-full"
              src={avatar}
              alt=""
            />
          ) : (
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 leading-none">
              <div className="text-xl font-bold text-gray-400">
                {username.charAt(0)}
              </div>
            </div>
          )}
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
            {username}
          </p>
          <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700">
            View profile
          </p>
        </div>
      </div>
    </UnstyledLink>
  </div>
);
