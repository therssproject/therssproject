import {ComponentPropsWithRef, forwardRef, ReactNode} from 'react';
import {match} from 'ts-pattern';

import {clsxm} from '@/lib/clsxm';

type Variant = 'danger' | 'info';

type Props = {
  variant?: Variant;
  children: ReactNode;
} & ComponentPropsWithRef<'button'>;

export const IconButton = forwardRef<HTMLButtonElement, Props>(
  ({children, className, variant = 'info', ...rest}, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={clsxm(
          'rounded-md p-1',
          'focus:outline-none focus:ring-2',
          'p-1',
          match(variant)
            .with('info', () => 'text-gray-400 focus:ring-gray-400')
            .with('danger', () => 'text-red-500 focus:ring-red-500')
            .exhaustive(),

          'disabled:cursor-not-allowed',
          className,
        )}
        {...rest}
      >
        {children}
      </button>
    );
  },
);
