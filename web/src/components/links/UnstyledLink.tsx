import Link, {LinkProps} from 'next/link';
import {ComponentPropsWithRef, forwardRef, MouseEventHandler} from 'react';

import * as track from '@/lib/analytics/track';
import {clsxm} from '@/lib/clsxm';
import {format, SafeHref} from '@/lib/href';

export type Props = {
  href: SafeHref;
  children: React.ReactNode;
  openNewTab?: boolean;
  className?: string;
  nextLinkProps?: Omit<LinkProps, 'href'>;
  noTrack?: boolean;
} & Omit<ComponentPropsWithRef<'a'>, 'href'>;

export const UnstyledLink = forwardRef<HTMLAnchorElement, Props>(
  (
    {
      children,
      href: safeHref,
      openNewTab,
      className,
      nextLinkProps,
      noTrack = false,
      ...rest
    },
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

    const trackExternal: MouseEventHandler<HTMLAnchorElement> = (event) => {
      if (rest.onClick) {
        rest.onClick(event);
      }

      if (noTrack || safeHref.tag !== 'External') {
        return;
      }

      track.externalLink(safeHref.path);
    };

    return (
      <a
        ref={ref}
        target="_blank"
        rel="noopener noreferrer"
        href={href}
        {...rest}
        className={clsxm('cursor-newtab', className)}
        onClick={trackExternal}
      >
        {children}
      </a>
    );
  },
);
