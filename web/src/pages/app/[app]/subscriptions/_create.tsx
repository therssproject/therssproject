import {Listbox, Transition} from '@headlessui/react';
import {CheckIcon, SelectorIcon} from '@heroicons/react/solid';
import {yupResolver} from '@hookform/resolvers/yup';
import * as A from 'fp-ts/Array';
import {pipe} from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import * as TE from 'fp-ts/TaskEither';
import {Fragment, useState} from 'react';
import {SubmitHandler, useForm} from 'react-hook-form';
import * as yup from 'yup';

import {clsxm} from '@/lib/clsxm';

import {SlideOver} from '@/components/SlideOver';

import {Endpoint} from '@/models/endpoint';
import {
  CreateSubscription as CreateSubscriptionBody,
  createSubscription,
  useSetNewSubscription,
} from '@/models/subscription';

const CreateSubscription_ = yup.object({
  url: yup.string().url().required(),
  endpoint: yup.string().required(),
});

type Props = {
  app: string;
  endpoints: Endpoint[];
  open: boolean;
  onClose: () => void;
};

const endpointToOption = (endpoint: Endpoint): SelectOption => ({
  label: endpoint.title,
  note: endpoint.url,
  value: endpoint.id,
});

export const Create = ({app, endpoints, open, onClose}: Props) => {
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    // TODO: show errors when InlineField component is created
    // formState: {error},
  } = useForm<CreateSubscriptionBody>({
    resolver: yupResolver(CreateSubscription_),
  });

  const setNewSubscription = useSetNewSubscription();

  const onSubmit: SubmitHandler<CreateSubscriptionBody> = async (body) => {
    setLoading(true);

    const run = pipe(
      createSubscription(app, body),
      TE.match(
        (err) => {
          // eslint-disable-next-line no-console
          console.log(err);
        },
        (newSubscription) => {
          setNewSubscription(newSubscription);
          onClose();
        },
      ),
    );

    await run();

    setLoading(true);
  };

  const endpointValue = watch('endpoint');

  return (
    <SlideOver
      open={open}
      onClose={() => {
        if (!loading) {
          onClose();
        }
      }}
    >
      <form
        className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="flex-1">
          {/* Header */}
          <SlideOver.Header
            title="Create subscription"
            description="Create an RSS subscription"
          />

          <div className="space-y-6 py-6 sm:space-y-0 sm:divide-y sm:divide-gray-200 sm:py-0">
            {/* Title */}
            <div className="space-y-1 px-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:space-y-0 sm:px-6 sm:py-5">
              <div>
                <label
                  htmlFor="url"
                  className="block text-sm font-medium text-gray-900 sm:mt-px sm:pt-2"
                >
                  RSS Feed URL
                </label>
              </div>
              <div className="sm:col-span-2">
                <input
                  type="text"
                  id="url"
                  placeholder="My subscription"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  {...register('url')}
                />
              </div>
            </div>

            {/* Endpoint */}
            <div className="space-y-1 px-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:space-y-0 sm:px-6 sm:py-5">
              <div>
                <label
                  htmlFor="endpoint"
                  className="block text-sm font-medium text-gray-900 sm:mt-px sm:pt-2"
                >
                  Endpoint
                </label>
              </div>
              <div className="sm:col-span-2">
                <Select
                  selected={pipe(
                    endpoints,
                    A.findFirst((endpoint) => endpoint.id === endpointValue),
                    O.map(endpointToOption),
                    O.toUndefined,
                  )}
                  options={endpoints.map(endpointToOption)}
                  onSelect={(endpoint) => setValue('endpoint', endpoint.value)}
                  {...register('endpoint')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex-shrink-0 border-t border-gray-200 px-4 py-5 sm:px-6">
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              disabled={loading}
            >
              Create
            </button>
          </div>
        </div>
      </form>
    </SlideOver>
  );
};

type SelectOption = {
  label: string;
  note: string;
  value: string;
};

type SelectProps = {
  // TODO: make this required
  selected?: SelectOption;
  options: SelectOption[];
  onSelect: (option: SelectOption) => void;
};

const Select = ({options, selected, onSelect}: SelectProps) => (
  <Listbox value={selected} onChange={onSelect}>
    {({open}) => (
      <>
        <div className="relative mt-1">
          <Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm">
            <span className="inline-flex w-full truncate">
              <span className="truncate">{selected?.label}</span>
              <span className="ml-2 truncate text-gray-500">
                {selected?.note}
              </span>
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <SelectorIcon
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </span>
          </Listbox.Button>

          <Transition
            show={open}
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {options.map((item) => (
                <Listbox.Option
                  key={item.note}
                  className={({active}) =>
                    clsxm(
                      active ? 'bg-indigo-600 text-white' : 'text-gray-900',
                      'relative cursor-default select-none py-2 pl-3 pr-9',
                    )
                  }
                  value={item}
                >
                  {({selected, active}) => (
                    <>
                      <div className="flex">
                        <span
                          className={clsxm(
                            selected ? 'font-semibold' : 'font-normal',
                            'truncate',
                          )}
                        >
                          {item.label}
                        </span>
                        <span
                          className={clsxm(
                            active ? 'text-indigo-200' : 'text-gray-500',
                            'ml-2 truncate',
                          )}
                        >
                          {item.note}
                        </span>
                      </div>

                      {selected ? (
                        <span
                          className={clsxm(
                            active ? 'text-white' : 'text-indigo-600',
                            'absolute inset-y-0 right-0 flex items-center pr-4',
                          )}
                        >
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </>
    )}
  </Listbox>
);
