import * as date from 'date-fns';
import * as A from 'fp-ts/Array';
import {pipe} from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import * as RD from 'remote-data-ts';

import {clsxm} from '@/lib/clsxm';
import {useAtom} from '@/lib/jotai';
import {Route} from '@/lib/routes';

import {UnstyledLink} from '@/components/links/UnstyledLink';

import {AppEndpointsAtom} from '@/models/endpoint';
import {Log} from '@/models/log';
import {AppSubscriptionsAtom} from '@/models/subscription';

export const LogItem = ({log}: {log: Log}) => {
  const [appEndpoints] = useAtom(AppEndpointsAtom);
  const [appSubscriptions] = useAtom(AppSubscriptionsAtom);

  const sentAt = new Date(log.created_at);

  return (
    <li>
      <div className="block hover:bg-gray-50">
        <div className="space-y-2 px-4 py-4 sm:px-6">
          <div className="flex items-center space-x-3">
            <span
              className={clsxm(
                log.status === 'sent' ? 'bg-green-100' : 'bg-gray-100',
                'flex h-4 w-4 items-center justify-center rounded-full',
              )}
              aria-hidden="true"
            >
              <span
                className={clsxm(
                  log.status === 'sent' ? 'bg-green-400' : 'bg-gray-400',
                  'h-2 w-2 rounded-full',
                )}
              />
            </span>

            <h2 className="text-sm font-medium">Webhook sent</h2>
          </div>

          <p className="truncate text-sm">
            <span className="text-gray-600">Sent to</span>{' '}
            {pipe(
              appEndpoints,
              RD.toOption,
              O.chain(A.findFirst(({id}) => id === log.endpoint)),
              O.match(
                () => (
                  <span className="font-medium text-gray-600">
                    {log.endpoint_url}
                  </span>
                ),
                (endpoint) => (
                  <UnstyledLink
                    href={Route.appEndpoints(endpoint.application)}
                    className="font-medium text-indigo-600"
                  >
                    {endpoint.title}
                  </UnstyledLink>
                ),
              ),
            )}{' '}
            <time
              className="text-gray-600"
              dateTime={log.created_at}
              title={date.format(sentAt, 'yyyy/MM/dd HH:MM:SS')}
            >
              {date.formatRelative(sentAt, Date.now())} (
              {date.format(sentAt, 'yyyy/MM/dd HH:MM:SS')})
            </time>
          </p>

          {log.feed_title && (
            <p className="truncate text-sm text-gray-500 group-hover:text-gray-900">
              Feed title: <span className="font-medium">{log.feed_title}</span>
            </p>
          )}

          <p className="truncate text-sm text-gray-500 group-hover:text-gray-900">
            Subscription:{' '}
            {pipe(
              appSubscriptions,
              RD.toOption,
              O.chain(A.findFirst(({id}) => id === log.subscription)),
              O.match(
                () => (
                  <span className="font-mono font-medium">{log.feed_url}</span>
                ),
                (subscription) => (
                  <UnstyledLink
                    href={Route.appSubs(subscription.application)}
                    className="font-mono font-medium"
                  >
                    {subscription.url}
                  </UnstyledLink>
                ),
              ),
            )}
          </p>
        </div>
      </div>
    </li>
  );
};
