import {forwardRef, ReactNode} from 'react';
import {match} from 'ts-pattern';

import {clsxm} from '@/lib/clsxm';

import {Input, Props as InputProps} from '@/components/inputs/Input';

export type Props = {
  input: InputProps;
  label?: string;
  message?: ReactNode;
};

export const TextField = forwardRef<HTMLInputElement, Props>(
  ({input, label, message}, ref) => (
    <div>
      {label && (
        <label
          htmlFor={input.id}
          className={clsxm(
            'text-sm font-medium',
            match(input.variant ?? 'default')
              .with('default', () => 'text-gray-800')
              .with('error', () => 'text-red-700')
              .with('success', () => 'text-green-700')
              .exhaustive(),
          )}
        >
          {input.required ? <>{label} *</> : label}
        </label>
      )}

      <div className={clsxm(Boolean(label) && 'mt-2')}>
        <Input ref={ref} {...input} />
      </div>

      {message ? (
        <p
          className={clsxm(
            'mt-2 text-sm',
            match(input.variant ?? 'default')
              .with('default', () => 'text-gray-500')
              .with('error', () => 'text-red-700')
              .with('success', () => 'text-green-700')
              .exhaustive(),
          )}
        >
          {message}
        </p>
      ) : null}
    </div>
  ),
);
