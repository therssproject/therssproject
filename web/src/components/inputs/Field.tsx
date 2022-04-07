import {ComponentType, forwardRef} from 'react';
import {match} from 'ts-pattern';

import clsxm from '@/lib/clsxm';

import {Input, Props as InputProps} from './Input';

type Props = {
  input: InputProps;
  label: string;
  message?: string;
  icon?: {
    onClick?: () => void;
    After?: ComponentType<{className: string}>;
  };
};

export const Field = forwardRef<HTMLInputElement, Props>(
  ({input, label, message, icon}, ref) => (
    <div>
      <label
        htmlFor={input.id}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
      </label>
      <div className="relative mt-1 rounded-md shadow-sm">
        <Input ref={ref} {...input} />
        {icon?.After ? (
          <button
            type="button"
            // Disable `tab` navigation when no handler or the input is disabled
            tabIndex={Boolean(icon.onClick) && !input.disabled ? undefined : -1}
            onClick={input.disabled ? undefined : icon.onClick}
            className={clsxm(
              'absolute inset-y-0 right-0',
              'flex items-center pr-3',
              Boolean(icon.onClick) && !input.disabled
                ? 'cursor-pointer'
                : 'pointer-events-none',
            )}
          >
            <icon.After
              className={clsxm(
                'h-5 w-5',
                match(input.variant ?? 'default')
                  .with('default', () => [])
                  .with('warning', () => ['text-yellow-900'])
                  .with('error', () => ['text-red-900'])
                  .with('success', () => ['text-green-900'])
                  .exhaustive(),
              )}
            />
          </button>
        ) : null}
      </div>
      {message ? (
        <p
          className={clsxm(
            'mt-2 text-sm',
            match(input.variant ?? 'default')
              .with('default', () => [])
              .with('warning', () => ['text-yellow-600'])
              .with('error', () => ['text-red-600'])
              .with('success', () => ['text-green-600'])
              .exhaustive(),
          )}
        >
          {message}
        </p>
      ) : null}
    </div>
  ),
);
