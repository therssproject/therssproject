import {Listbox} from '@headlessui/react';
import {CheckIcon, SelectorIcon} from '@heroicons/react/solid';
import ColorHash from 'color-hash';

import {clsxm} from '@/lib/clsxm';

const colorHash = new ColorHash({lightness: 0.9});

const hashHexColor = (input: string) => colorHash.hex(input);

export type Option = {
  id: string | number;
  label: string;
  image?: string | ((label: Option) => string);
  disabled?: boolean;
};

type Props<O extends Option> = {
  options: O[];
  selected?: O;
  onSelect: (option?: O) => void;
  disabled?: boolean;
};

export const Select = <O extends Option>({
  options,
  selected: selectedO,
  onSelect,
  disabled,
}: Props<O>) => {
  return (
    <Listbox value={selectedO} onChange={onSelect} disabled={disabled}>
      <div className="relative mt-1 w-full">
        <Listbox.Button
          className={clsxm(
            'flex items-center justify-between',
            'w-full rounded-md border border-gray-300 bg-white',
            'p-2 shadow-sm focus:border-indigo-500',
            'focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm',
          )}
        >
          <div className="flex items-center justify-between">
            {selectedO &&
              (typeof selectedO.image === 'string' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedO.image}
                  alt=""
                  className="mr-2 h-6 w-6 flex-shrink-0 rounded-full"
                />
              ) : (
                <div
                  className="mr-2 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 leading-none"
                  style={{backgroundColor: hashHexColor(selectedO.label)}}
                >
                  <div className="text-lg font-bold text-gray-600">
                    {selectedO.image
                      ? selectedO.image(selectedO)
                      : selectedO.label.charAt(0)}
                  </div>
                </div>
              ))}

            <span>{selectedO?.label}</span>
          </div>

          <SelectorIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </Listbox.Button>

        {options.length > 0 && (
          <Listbox.Options className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            {options.map((option) => (
              <Listbox.Option
                key={option.id}
                value={option}
                className={({active}) =>
                  clsxm(
                    'relative cursor-pointer select-none py-2 pl-3 pr-9',
                    active ? 'bg-indigo-600 text-white' : 'text-gray-900',
                  )
                }
                disabled={option.disabled}
              >
                {({active, selected}) => (
                  <>
                    <div className="flex items-center">
                      {typeof option.image === 'string' ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={option.image}
                          alt=""
                          className="h-6 w-6 flex-shrink-0 rounded-full"
                        />
                      ) : (
                        <div
                          className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full leading-none"
                          style={{backgroundColor: hashHexColor(option.label)}}
                        >
                          <div className="text-lg font-bold text-gray-600">
                            {option.image
                              ? option.image(option)
                              : option.label.charAt(0)}
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
              </Listbox.Option>
            ))}
          </Listbox.Options>
        )}
      </div>
    </Listbox>
  );
};
