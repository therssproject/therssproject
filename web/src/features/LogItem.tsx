import * as date from 'date-fns';
import * as A from 'fp-ts/Array';
import {pipe} from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import * as RD from 'remote-data-ts';

import {clsxm} from '@/lib/clsxm';
import {useAtom} from '@/lib/jotai';

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

          {pipe(
            appEndpoints,
            RD.toOption,
            O.chain(A.findFirst(({id}) => id === log.endpoint)),
            O.match(
              () => null,
              (endpoint) => (
                <p className="truncate text-sm">
                  <span className="text-gray-600">Sent to</span>{' '}
                  <span className="font-medium text-indigo-600">
                    {endpoint.title}
                  </span>{' '}
                  <time
                    className="text-gray-600"
                    dateTime={log.sent_at}
                    title={date.format(sentAt, 'yyyy/MM/dd HH:MM')}
                  >
                    {date.formatRelative(sentAt, Date.now())}
                  </time>
                </p>
              ),
            ),
          )}

          <p className="truncate text-sm text-gray-500 group-hover:text-gray-900">
            Feed title: <span className="font-medium">{log.feed_title}</span>
          </p>

          {pipe(
            appSubscriptions,
            RD.toOption,
            O.chain(A.findFirst(({id}) => id === log.subscription)),
            O.match(
              () => null,
              (subscription) => (
                <p className="truncate text-sm text-gray-500 group-hover:text-gray-900">
                  Subscription:{' '}
                  <span className="font-mono font-medium">
                    {subscription.url}
                  </span>
                </p>
              ),
            ),
          )}
        </div>
      </div>
    </li>
  );
};
