import {Route} from '@/lib/routes';

import {UnstyledLink} from '@/components/links/UnstyledLink';

import {Rss} from './icons/Rss';

export const Logo = () => (
  <UnstyledLink href={Route.index}>
    <div className="flex flex-shrink-0 items-center space-x-2">
      <Rss className="h-10 w-10" />
      <div className="h3 text-gray-600">therssproject</div>
    </div>
  </UnstyledLink>
);
