import {Combobox as ComboboxHeadless} from '@headlessui/react';
import {CheckIcon, SelectorIcon} from '@heroicons/react/solid';
import {useState} from 'react';

import clsxm from '@/lib/clsxm';

export type Option = {
  id: string | number;
  label: string;
  imageUrl?: string;
};

type Props = {
  options: Option[];
  selected?: Option;
  onSelect: (option?: Option) => void;
};

export const Combobox = ({options, selected: selectedO, onSelect}: Props) => {
  const [query, setQuery] = useState('');

  // TODO: use match-sorter?
  const filteredOptions =
    query === ''
      ? options
      : options.filter((option) =>
          option.label.toLowerCase().includes(query.toLowerCase()),
        );

  return (
    <ComboboxHeadless as="div" value={selectedO} onChange={onSelect}>
      <div className="relative mt-1">
        {selectedO &&
          (selectedO.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={selectedO.imageUrl}
              alt=""
              className={clsxm(
                'h-6 w-6 flex-shrink-0 rounded-full',
                'absolute left-2 top-1/2 -translate-y-1/2 transform',
              )}
            />
          ) : (
            <div
              className={clsxm(
                'inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 leading-none',
                'absolute left-2 top-1/2 -translate-y-1/2 transform',
              )}
            >
              <div className="text-lg font-bold text-gray-400">
                {selectedO.label.charAt(0)}
              </div>
            </div>
          ))}

        <ComboboxHeadless.Input
          className={clsxm(
            'w-full rounded-md border border-gray-300 bg-white',
            'py-2 pl-3 pr-10 shadow-sm focus:border-indigo-500',
            'focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm',
            selectedO && 'pl-10',
          )}
          onChange={(event) => setQuery(event.target.value)}
          displayValue={(option: Option) => option.label}
        />

        {/* TODO: could the button be the display instead */}
        <ComboboxHeadless.Button className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none">
          <SelectorIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </ComboboxHeadless.Button>

        {filteredOptions.length > 0 && (
          <ComboboxHeadless.Options className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            {filteredOptions.map((option) => (
              <ComboboxHeadless.Option
                key={option.id}
                value={option}
                className={({active}) =>
                  clsxm(
                    'relative cursor-default select-none py-2 pl-3 pr-9',
                    active ? 'bg-indigo-600 text-white' : 'text-gray-900',
                  )
                }
              >
                {({active, selected}) => (
                  <>
                    <div className="flex items-center">
                      {option.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={option.imageUrl}
                          alt=""
                          className="h-6 w-6 flex-shrink-0 rounded-full"
                        />
                      ) : (
                        <div className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 leading-none">
                          <div className="text-lg font-bold text-gray-400">
                            {option.label.charAt(0)}
                          </div>
                        </div>
                      )}
                      <span
                        className={clsxm(
                          'ml-3 truncate',
                          selected && 'font-semibold',
                        )}
                      >
                        {option.label}
                      </span>
                    </div>

                    {selected && (
                      <span
                        className={clsxm(
                          'absolute inset-y-0 right-0 flex items-center pr-4',
                          active ? 'text-white' : 'text-indigo-600',
                        )}
                      >
                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                      </span>
                    )}
                  </>
                )}
              </ComboboxHeadless.Option>
            ))}
          </ComboboxHeadless.Options>
        )}
      </div>
    </ComboboxHeadless>
  );
};
