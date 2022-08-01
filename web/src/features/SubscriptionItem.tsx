import {CheckIcon, RssIcon, TrashIcon} from '@heroicons/react/outline';
import {ClipboardCheckIcon, ClipboardIcon} from '@heroicons/react/outline';
import {CalendarIcon} from '@heroicons/react/solid';
import * as date from 'date-fns';
import * as A from 'fp-ts/Array';
import {pipe} from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import {useState} from 'react';
import * as RD from 'remote-data-ts';

import * as track from '@/lib/analytics/track';
import {useCopyToClipboard} from '@/lib/clipboard';
import {useAtom} from '@/lib/jotai';
import {Route} from '@/lib/routes';

import {IconButton} from '@/components/buttons/IconButton';
import {UnstyledLink} from '@/components/links/UnstyledLink';

import {AppEndpointsAtom} from '@/models/endpoint';
import {Subscription} from '@/models/subscription';

type Props = {
  subscription: Subscription;
  onDelete: (subscription: Subscription) => void;
};

export const SubscriptionItem = ({subscription, onDelete}: Props) => {
  const [confirm, setConfirm] = useState(false);
  const [appEndpoints] = useAtom(AppEndpointsAtom);
  const clipboard = {id: useCopyToClipboard()};

  const onDeleteClick = () => {
    if (confirm) {
      onDelete(subscription);
    } else {
      setConfirm(true);
    }
  };

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

          <button
            type="button"
            className="flex items-center space-x-2 text-gray-500"
            onClick={() => {
              clipboard.id.copy(subscription.id);
              track.copyId('sub');
            }}
          >
            <span className="text-md font-bold">ID:</span>
            <p className="text-md">{subscription.id}</p>
            {clipboard.id.didCopy ? (
              <div className="flex items-center text-sm">
                <ClipboardCheckIcon
                  className="mr-1 h-6 w-6 flex-shrink-0 text-gray-400"
                  aria-hidden="true"
                />
                Copied!
              </div>
            ) : (
              <div className="flex items-center text-sm">
                <ClipboardIcon
                  className="mr-1 h-6 w-6 flex-shrink-0 text-gray-400"
                  aria-hidden="true"
                />
                Copy
              </div>
            )}
          </button>

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
                    href={Route.appEndpoints(endpoint.application)}
                    className="font-medium text-indigo-600"
                  >
                    {endpoint.title}
                  </UnstyledLink>
                </p>
              ),
            ),
          )}

          <div className="flex justify-between">
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

            <IconButton
              onClick={onDeleteClick}
              onBlur={() => setConfirm(false)}
              variant={confirm ? 'danger' : 'info'}
            >
              {confirm ? (
                <CheckIcon className="h-6 w-6" />
              ) : (
                <TrashIcon className="h-6 w-6" />
              )}
            </IconButton>
          </div>
        </div>
      </div>
    </li>
  );
};
