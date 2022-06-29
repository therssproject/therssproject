import {RssIcon} from '@heroicons/react/outline';
import {CalendarIcon} from '@heroicons/react/solid';
import * as date from 'date-fns';
import * as A from 'fp-ts/Array';
import {pipe} from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import * as RD from 'remote-data-ts';

import {useAtom} from '@/lib/jotai';
import {Route} from '@/lib/routes';

import {UnstyledLink} from '@/components/links/UnstyledLink';

import {AppEndpointsAtom} from '@/models/endpoint';
import {Subscription} from '@/models/subscription';

export const SubscriptionItem = ({
  subscription,
}: {
  subscription: Subscription;
}) => {
  const [appEndpoints] = useAtom(AppEndpointsAtom);

  return (
    <li>
      <div className="block hover:bg-gray-50">
        <div className="space-y-2 px-4 py-4 sm:px-6">
          <p className="text-md flex items-center text-gray-500">
            <RssIcon
              className="mr-1.5 h-6 w-6 flex-shrink-0 text-gray-400"
              aria-hidden="true"
            />
            <span className="font-mono">{subscription.url}</span>
          </p>

          <div className="flex items-center text-sm text-gray-500">
            <CalendarIcon
              className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400"
              aria-hidden="true"
            />
            <p>
              Created{' '}
              <time dateTime={subscription.created_at}>
                {date.format(
                  new Date(subscription.created_at),
                  'yyyy/MM/dd HH:MM',
                )}
              </time>
            </p>
          </div>

          {pipe(
            appEndpoints,
            RD.toOption,
            O.chain(A.findFirst((e) => e.id === subscription.endpoint)),
            O.match(
              () => null,
              (endpoint) => (
                <p className="truncate text-sm">
                  <span className="text-gray-600">Events sent to</span>{' '}
                  <UnstyledLink
                    href={Route.appEndpoints(endpoint.application, false)}
                    className="font-medium text-indigo-600"
                  >
                    {endpoint.title}
                  </UnstyledLink>
                </p>
              ),
            ),
          )}
        </div>
      </div>
    </li>
  );
};
