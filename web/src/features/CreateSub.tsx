import {Listbox, Transition} from '@headlessui/react';
import {CheckIcon, SelectorIcon} from '@heroicons/react/solid';
import {yupResolver} from '@hookform/resolvers/yup';
import * as A from 'fp-ts/Array';
import {pipe} from 'fp-ts/function';
import * as NEA from 'fp-ts/NonEmptyArray';
import * as O from 'fp-ts/Option';
import * as TE from 'fp-ts/TaskEither';
import {Fragment, useState} from 'react';
import {SubmitHandler, useForm} from 'react-hook-form';
import * as yup from 'yup';

import {clsxm} from '@/lib/clsxm';
import {Route} from '@/lib/routes';

import {Button} from '@/components/buttons/Button';
import {TextField} from '@/components/inputs/TextField';
import {PrimaryLink} from '@/components/links/PrimaryLink';
import {SlideOver} from '@/components/SlideOver';
import {Terminal} from '@/components/Terminal';

import * as SNIPPETS from '@/content/snippets';
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
  endpoints: NEA.NonEmptyArray<Endpoint>;
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
    reset,
    formState: {errors},
  } = useForm<CreateSubscriptionBody>({
    resolver: yupResolver(CreateSubscription_),
    defaultValues: {
      endpoint: NEA.head(endpoints).id,
    },
  });

  const setNewSubscription = useSetNewSubscription();

  const doClose = () => {
    if (!loading) {
      onClose();
      reset();
    }
  };

  const onSubmit: SubmitHandler<CreateSubscriptionBody> = async (body) => {
    setLoading(true);

    const run = pipe(
      createSubscription(app, body),
      TE.match(
        (err) => {
          // eslint-disable-next-line no-console
          console.log(err);
        },
        ({data: newSubscription}) => {
          setNewSubscription(newSubscription);
          doClose();
        },
      ),
    );

    await run();

    setLoading(false);
  };

  const endpointValue = watch('endpoint');

  return (
    <SlideOver open={open} onClose={doClose}>
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

          <div className="space-y-6 py-6 sm:space-y-0 sm:py-0">
            {/* Feed URL */}
            <div className="p-6">
              <TextField
                label="RSS Feed URL"
                input={{
                  id: 'url',
                  placeholder: 'https://rss.art19.com/apology-line',
                  variant: errors.url ? 'error' : 'default',
                  ...register('url'),
                }}
              />
            </div>

            {/* Endpoint */}
            <div className="p-6">
              <label
                htmlFor="endpoint"
                className="block text-sm font-medium text-gray-800"
              >
                Endpoint
              </label>
              <div className="mt-2">
                <Select
                  selected={pipe(
                    endpoints,
                    A.findFirst((endpoint) => endpoint.id === endpointValue),
                    O.map(endpointToOption),
                    O.toUndefined,
                  )}
                  options={endpoints.map(endpointToOption)}
                  onSelect={(endpoint) => setValue('endpoint', endpoint.value)}
                  // TODO: what about this?
                  {...register('endpoint')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex-shrink-0">
          {/* Mobile version */}
          <div className="p-6 md:hidden">
            <p className="text-sm text-gray-600">
              Want to register endpoints using the API instead?{' '}
              <PrimaryLink href={Route.documentation}>
                Check the docs
              </PrimaryLink>{' '}
            </p>
          </div>

          {/* Others */}
          <div className="hidden space-y-4 p-6 md:block">
            <h3 className="text-lg font-medium text-gray-600">
              Or using the API
            </h3>

            <Terminal
              id="createSubscription"
              snippet={SNIPPETS.createSubscription}
            />

            <p className="text-sm text-gray-600">
              Go to{' '}
              <PrimaryLink href={Route.appSettingsKeys(app)}>
                Settings {'>'} Keys
              </PrimaryLink>{' '}
              to generate API Keys for this application.
            </p>
          </div>

          <div className=" border-t border-gray-200 px-4 py-5 sm:px-6">
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={doClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                Create
              </Button>
            </div>
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
          <Listbox.Button className="relative w-full cursor-default rounded-lg border-2 border-gray-300 bg-gray-50 py-3 pl-3 pr-10 text-left shadow-sm focus:border-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-600 sm:text-sm">
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
            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-gray-50 py-1 text-base shadow-lg ring-2 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
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
