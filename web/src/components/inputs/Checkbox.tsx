import * as React from 'react';

import clsxm from '@/lib/clsxm';

type Props = Omit<React.ComponentPropsWithRef<'input'>, 'type'>;

export const Checkbox = React.forwardRef<HTMLInputElement, Props>(
  ({className, ...rest}, ref) => (
    <input
      ref={ref}
      type="checkbox"
      className={clsxm(
        'h-4 w-4',
        'rounded border-gray-300 text-indigo-600',
        'focus:ring-indigo-500',
        className,
      )}
      {...rest}
    />
  ),
);
