import * as React from 'react';

import clsxm from '@/lib/clsxm';

type Props = React.ComponentPropsWithRef<'input'>;

export const Input = React.forwardRef<HTMLInputElement, Props>(
  ({className, ...rest}, ref) => (
    <input
      ref={ref}
      type="text"
      className={clsxm(
        'block w-full appearance-none rounded-md',
        'border border-gray-300 px-3 py-2',
        'placeholder-gray-400 shadow-sm',
        'focus:border-indigo-500 focus:outline-none focus:ring-indigo-500',
        'sm:text-sm',
        className,
      )}
      {...rest}
    />
  ),
);
