import Link, {LinkProps} from 'next/link';
import {ComponentPropsWithRef, forwardRef} from 'react';

import {clsxm} from '@/lib/clsxm';
import {format, SafeHref} from '@/lib/href';

export type Props = {
  href: SafeHref;
  children: React.ReactNode;
  openNewTab?: boolean;
  className?: string;
  nextLinkProps?: Omit<LinkProps, 'href'>;
} & Omit<ComponentPropsWithRef<'a'>, 'href'>;

export const UnstyledLink = forwardRef<HTMLAnchorElement, Props>(
  (
    {children, href: safeHref, openNewTab, className, nextLinkProps, ...rest},
    ref,
  ) => {
    const href = format(safeHref);

    const isNewTab =
      openNewTab !== undefined
        ? openNewTab
        : href && !href.startsWith('/') && !href.startsWith('#');

    if (!isNewTab) {
      return (
        <Link href={href} {...nextLinkProps}>
          <a ref={ref} {...rest} className={className}>
            {children}
          </a>
        </Link>
      );
    }

    return (
      <a
        ref={ref}
        target="_blank"
        rel="noopener noreferrer"
        href={href}
        {...rest}
        className={clsxm('cursor-newtab', className)}
      >
        {children}
      </a>
    );
  },
);
