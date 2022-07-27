import * as React from 'react';

import {
  Props as UnstyledLinkProps,
  UnstyledLink,
} from '@/components/links/UnstyledLink';

import {buttonClsxm, ButtonVariant} from '../buttons/Button';

type Props = {
  isDarkBg?: boolean;
  variant?: ButtonVariant;
} & UnstyledLinkProps;

export const ButtonLink = React.forwardRef<HTMLAnchorElement, Props>(
  (
    {children, className = '', variant = 'primary', isDarkBg = false, ...rest},
    ref,
  ) => {
    return (
      <UnstyledLink
        ref={ref}
        {...rest}
        className={buttonClsxm({
          variant,
          isDarkBg,
          isFullWidth: false,
          isLoading: false,
          className,
        })}
      >
        {children}
      </UnstyledLink>
    );
  },
);
