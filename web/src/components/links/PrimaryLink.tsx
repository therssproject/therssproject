import * as React from 'react';

import {clsxm} from '@/lib/clsxm';

import {
  Props as UnstyledLinkProps,
  UnstyledLink,
} from '@/components/links/UnstyledLink';

export const PrimaryLink = React.forwardRef<
  HTMLAnchorElement,
  UnstyledLinkProps
>(({className, children, ...rest}, ref) => {
  return (
    <UnstyledLink
      ref={ref}
      {...rest}
      className={clsxm(
        'inline-flex items-center',
        'font-medium text-cyan-600 hover:text-cyan-500',
        'focus:outline-none focus-visible:rounded focus-visible:ring focus-visible:ring-cyan-500 focus-visible:ring-offset-1',
        className,
      )}
    >
      {children}
    </UnstyledLink>
  );
});
