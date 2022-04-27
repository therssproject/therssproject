import {Dialog, Transition} from '@headlessui/react';
import {
  CalendarIcon,
  ChartBarIcon,
  DocumentTextIcon,
  FolderIcon,
  HomeIcon,
  InboxIcon,
  InformationCircleIcon,
  LogoutIcon,
  UsersIcon,
  XIcon,
} from '@heroicons/react/outline';
import {ComponentType, FC, Fragment} from 'react';

import clsxm from '@/lib/clsxm';

import {Select, Option as SelectOption} from '@/components/Select';
import {Rss} from '@/components/icons/Rss';

import {PublicUser} from '@/models/user';

import {UnstyledLink} from './links/UnstyledLink';

type NavLink = {
  name: string;
  href: string;
  icon: ComponentType<{className: string}>;
  current: boolean;
};

const navigation: NavLink[] = [
  {name: 'Dashboard', icon: HomeIcon, href: '#', current: true},
  {name: 'Team', icon: UsersIcon, href: '#', current: false},
  {name: 'Projects', icon: FolderIcon, href: '#', current: false},
  {name: 'Calendar', icon: CalendarIcon, href: '#', current: false},
  {name: 'Documents', icon: InboxIcon, href: '#', current: false},
  {name: 'Reports', icon: ChartBarIcon, href: '#', current: false},
];

type SecondaryNavItem =
  | ({type: 'link'} & NavLink)
  | {
      type: 'action';
      name: string;
      icon: ComponentType<{className: string}>;
      action: () => void;
    };

const secondaryNavigation = (onLogout: () => void): SecondaryNavItem[] => [
  {
    type: 'link',
    name: 'Documentation',
    icon: DocumentTextIcon,
    href: '#',
    current: false,
  },
  {
    type: 'link',
    name: 'Share feedback',
    icon: InformationCircleIcon,
    href: '#',
    current: false,
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
  apps: SelectOption[];
  selectedApp?: SelectOption;
  onSelectApp: (app?: SelectOption) => void;
};

export const Sidebar: FC<Props> = ({
  isOpen,
  onClose,
  onLogout,
  user,
  apps,
  selectedApp,
  onSelectApp,
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
                <Logo />
                <nav className="mt-5 space-y-1 px-2">
                  <MainNav />
                </nav>
              </div>
              <SecondaryNav onLogout={onLogout} />
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
        <div className="flex flex-grow flex-col overflow-y-auto border-r border-gray-200 bg-white pt-5">
          <Logo />
          <div className="mx-2 mt-5">
            <Select
              options={apps}
              selected={selectedApp}
              onSelect={onSelectApp}
            />
          </div>
          <div className="mt-5 flex flex-grow flex-col">
            <nav
              className="flex-1 space-y-8 bg-white px-2"
              aria-label="Sidebar"
            >
              <div className="space-y-1">
                <MainNav />
              </div>
            </nav>
          </div>
          <SecondaryNav onLogout={onLogout} />
          <Profile username={user.name} />
        </div>
      </div>
    </>
  );
};

const Logo = () => (
  <UnstyledLink href="/">
    <div className="flex flex-shrink-0 items-center px-4">
      <Rss className="h-8 w-auto text-red-300" />
      <h2 className="ml-2 text-gray-600">rss</h2>
    </div>
  </UnstyledLink>
);

const MainNav = () => (
  <>
    {navigation.map((item) => (
      <a
        key={item.name}
        href={item.href}
        className={clsxm(
          item.current
            ? 'bg-gray-100 text-gray-900'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
          'group flex items-center rounded-md px-2 py-2 text-base font-medium',
        )}
      >
        <item.icon
          className={clsxm(
            item.current
              ? 'text-gray-500'
              : 'text-gray-400 group-hover:text-gray-500',
            'mr-4 h-6 w-6 flex-shrink-0',
          )}
          aria-hidden="true"
        />
        {item.name}
      </a>
    ))}
  </>
);

const SecondaryNav = ({onLogout}: {onLogout: () => void}) => (
  <div
    className="space-y-1 px-2"
    role="group"
    aria-labelledby="projects-headline"
  >
    {secondaryNavigation(onLogout).map((item) =>
      item.type === 'link' ? (
        <a
          key={item.name}
          href={item.href}
          className={clsxm(
            item.current
              ? 'bg-gray-100 text-gray-700'
              : 'text-gray-400 hover:bg-gray-50 hover:text-gray-700',
            'group flex items-center rounded-md px-2 py-2 text-base font-medium',
          )}
        >
          <item.icon
            className={clsxm(
              item.current
                ? 'text-gray-600'
                : 'text-gray-400 group-hover:text-gray-600',
              'mr-4 h-5 w-5 flex-shrink-0',
            )}
            aria-hidden="true"
          />
          {item.name}
        </a>
      ) : (
        <button
          key={item.name}
          onClick={item.action}
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

const Profile = ({username, avatar}: {username: string; avatar?: string}) => (
  <div className="mt-4 flex flex-shrink-0 border-t border-gray-200 p-4">
    <a href="#" className="group block w-full flex-shrink-0">
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
    </a>
  </div>
);
