import {Dialog, Transition} from '@headlessui/react';
import {XIcon} from '@heroicons/react/outline';
import {ComponentType, Fragment, ReactNode, RefObject} from 'react';
import {match} from 'ts-pattern';

import {clsxm} from '@/lib/clsxm';

type Props = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  initialFocus?: RefObject<HTMLElement>;
};

export const SlideOver = ({open, onClose, initialFocus, children}: Props) => {
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-10"
        onClose={onClose}
        initialFocus={initialFocus}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto relative w-screen max-w-2xl">
                  <Transition.Child
                    as={Fragment}
                    enter="ease-in-out duration-500"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in-out duration-500"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <div className="absolute top-0 right-0 flex pt-4 pr-8">
                      <button
                        type="button"
                        className="rounded-md text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-400"
                        onClick={onClose}
                      >
                        <span className="sr-only">Close panel</span>
                        <XIcon className="h-6 w-6" aria-hidden="true" />
                      </button>
                    </div>
                  </Transition.Child>

                  {children}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

type HeaderProps = {
  icon?: {
    variant: 'info' | 'success' | 'danger' | 'warn';
    Component: ComponentType<{className: string}>;
  };
  title: ReactNode;
  description?: ReactNode;
};

SlideOver.Header = ({title, description, icon}: HeaderProps) => (
  <div className="bg-gray-50 px-4 py-6 sm:px-6">
    {icon ? (
      <div className="sm:flex sm:items-start">
        <div
          className={clsxm(
            'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10',
            match(icon.variant)
              .with('warn', () => 'bg-yellow-100')
              .with('danger', () => 'bg-red-100')
              .with('success', () => 'bg-green-100')
              .with('info', () => 'bg-blue-100')
              .exhaustive(),
          )}
        >
          <icon.Component
            className={clsxm(
              'h-6 w-6',
              match(icon.variant)
                .with('warn', () => 'text-yellow-600')
                .with('danger', () => 'text-red-600')
                .with('success', () => 'text-green-600')
                .with('info', () => 'text-blue-600')
                .exhaustive(),
            )}
            aria-hidden="true"
          />
        </div>

        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
          <Dialog.Title as="h3" className="text-lg font-medium text-gray-900">
            Create API Key
          </Dialog.Title>

          {description && (
            <p className="text-sm text-gray-500">{description}</p>
          )}
        </div>
      </div>
    ) : (
      <div className="flex items-start justify-between space-x-3">
        <div className="space-y-1">
          <Dialog.Title className="text-lg font-medium text-gray-900">
            {title}
          </Dialog.Title>
          {description && (
            <p className="text-sm text-gray-500">{description}</p>
          )}
        </div>
      </div>
    )}
  </div>
);
