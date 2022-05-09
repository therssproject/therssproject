import {Route} from '@/lib/routes';

import {UnstyledLink} from '@/components/links/UnstyledLink';

const links = [
  {href: Route.index, label: 'Route 1'},
  {href: Route.index, label: 'Route 2'},
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white">
      <div className="layout flex h-14 items-center justify-between">
        <UnstyledLink
          href={Route.index}
          className="font-bold hover:text-gray-600"
        >
          Home
        </UnstyledLink>
        <nav>
          <ul className="flex items-center justify-between space-x-4">
            {links.map(({href, label}) => (
              <li key={`${href}${label}`}>
                <UnstyledLink href={href} className="hover:text-gray-600">
                  {label}
                </UnstyledLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
