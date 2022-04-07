import {forwardRef} from 'react';
import {match} from 'ts-pattern';

import clsxm from '@/lib/clsxm';

type InputVariant = 'default' | 'warning' | 'error' | 'success';

type IconPosition = 'none' | 'after';

export type Props = {
  variant?: InputVariant;
  iconPosition?: IconPosition;
} & React.ComponentPropsWithRef<'input'>;

export const Input = forwardRef<HTMLInputElement, Props>(
  ({variant = 'default', iconPosition = 'none', className, ...rest}, ref) => (
    <input
      ref={ref}
      type="text"
      className={clsxm(
        'block w-full appearance-none rounded-md',
        'border px-3 py-2 shadow-sm focus:outline-none sm:text-sm',

        match(iconPosition)
          .with('none', () => [])
          .with('after', () => ['pr-10'])
          .exhaustive(),

        match(variant)
          .with('default', () => [
            'border-gray-300',
            'placeholder-gray-400',
            'focus:border-indigo-500 focus:ring-indigo-500',
          ])
          .with('warning', () => [
            'border-yellow-300 text-yellow-900',
            'placeholder-yellow-300',
            'focus:border-yellow-500 focus:ring-yellow-500',
          ])
          .with('error', () => [
            'border-red-300 text-red-900',
            'placeholder-red-300',
            'focus:border-red-500 focus:ring-red-500',
          ])
          .with('success', () => [
            'border-green-300 text-green-900',
            'placeholder-green-300',
            'focus:border-green-500 focus:ring-green-500',
          ])
          .exhaustive(),

        className,
      )}
      {...rest}
    />
  ),
);
