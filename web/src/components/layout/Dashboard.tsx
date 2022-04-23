import {MenuIcon} from '@heroicons/react/outline';
import {pipe} from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import {useAtom} from 'jotai';
import {ReactNode, useState} from 'react';

import {useOnlyLoggedIn} from '@/lib/auth';

import {Combobox, Option as ComboboxOption} from '@/components/Combobox';
import {Props as SeoProps, Seo} from '@/components/Seo';
import {Sidebar} from '@/components/Sidebar';

import {SessionAtom} from '@/store/session';

const options: ComboboxOption[] = [
  {id: 'tsplay.dev', label: 'Tsplay.dev'},
  {id: 'listas', label: 'Listas.io'},
  {id: 'rss', label: 'Rss'},
];

type Props = {
  title: string;
  children: ReactNode;
  seo?: SeoProps;
};

export const Dashboard = ({title, children, seo}: Props) => {
  useOnlyLoggedIn();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [session, setSession] = useAtom(SessionAtom);

  const [option, setOption] = useState<ComboboxOption | undefined>(options[0]);

  return pipe(
    session,
    O.match(
      () => null,
      ({user}) => (
        <div>
          <Seo {...seo} />

          <Sidebar
            isOpen={sidebarOpen}
            user={user}
            onOpen={() => setSidebarOpen(true)}
            onClose={() => setSidebarOpen(false)}
            onLogout={() => setSession(O.none)}
            apps={options}
            selectedApp={option}
            onSelectApp={setOption}
          />
          <div className="flex flex-1 flex-col md:pl-64">
            <div className="sticky top-0 z-10 flex bg-white pl-1 pt-1 sm:pl-3 sm:pt-3 md:hidden">
              <button
                type="button"
                className="-ml-0.5 -mt-0.5 inline-flex h-12 w-12 items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                onClick={() => setSidebarOpen(true)}
              >
                <span className="sr-only">Open sidebar</span>
                <MenuIcon className="h-6 w-6" aria-hidden="true" />
              </button>

              <div className="mx-2">
                <Combobox
                  options={options}
                  selected={option}
                  onSelect={setOption}
                />
              </div>
            </div>
            <main className="flex-1">
              <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
                  <h1 className="text-2xl font-semibold text-gray-900">
                    {title}
                  </h1>
                </div>
                <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
                  {children}
                </div>
              </div>
            </main>
          </div>
        </div>
      ),
    ),
  );
};
