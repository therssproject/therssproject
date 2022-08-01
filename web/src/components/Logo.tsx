import {clsxm} from '@/lib/clsxm';
import {Route} from '@/lib/routes';

import {UnstyledLink} from '@/components/links/UnstyledLink';

import {Rss} from './icons/Rss';

type Style = 'light' | 'dark';

export const Logo = ({style = 'dark'}: {style?: Style}) => (
  <UnstyledLink href={Route.index}>
    <div className="flex flex-shrink-0 items-center space-x-2">
      <Rss className="h-10 w-10" />
      <div
        className={clsxm(
          'h3 font-medium',
          style === 'dark' && 'text-gray-600',
          style === 'light' && 'text-gray-300',
        )}
      >
        therssproject
      </div>
    </div>
  </UnstyledLink>
);
