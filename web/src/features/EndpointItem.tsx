import {LinkIcon, TrashIcon} from '@heroicons/react/24/outline';
import {
  ClipboardDocumentCheckIcon,
  ClipboardIcon,
} from '@heroicons/react/24/outline';
import {
  CalendarIcon,
  CheckIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/solid';
import * as date from 'date-fns';
import * as A from 'fp-ts/Array';
import {pipe} from 'fp-ts/function';
import {useState} from 'react';
import * as RD from 'remote-data-ts';

import * as track from '@/lib/analytics/track';
import {useCopyToClipboard} from '@/lib/clipboard';
import {useAtom} from '@/lib/jotai';

import {IconButton} from '@/components/buttons/IconButton';
import {useToast} from '@/components/Toast';

import {Endpoint} from '@/models/endpoint';
import {AppSubscriptionsAtom} from '@/models/subscription';

type Props = {
  endpoint: Endpoint;
  onDelete: (endpoint: Endpoint) => void;
  onEdit: (endpoint: Endpoint) => void;
};

export const EndpointItem = ({endpoint, onDelete, onEdit}: Props) => {
  const toast = useToast();
  const [confirm, setConfirm] = useState(false);
  const [appSubscriptions, _setAppSubscriptions] =
    useAtom(AppSubscriptionsAtom);

  const clipboard = {id: useCopyToClipboard()};

  const hasSubs = pipe(
    RD.toNullable(appSubscriptions) ?? [],
    A.some((sub) => sub.endpoint === endpoint.id),
  );

  const onDeleteClick = () => {
    if (hasSubs) {
      toast.showUnique(
        'pending_subs',
        'This endpoint has subscriptions. Delete those first',
        {variant: 'warning'},
      );
    } else if (confirm) {
      onDelete(endpoint);
    } else {
      setConfirm(true);
    }
  };

  return (
    <li>
      <div className="block hover:bg-gray-50">
        <div className="space-y-2 px-4 py-4 sm:px-6">
          <p className="text-md truncate font-medium text-indigo-600">
            {endpoint.title}
          </p>

          <button
            type="button"
            className="flex items-center space-x-2 text-gray-500"
            onClick={() => {
              clipboard.id.copy(endpoint.id);
              track.copyId('endpoint');
            }}
          >
            <span className="text-md font-bold">ID:</span>
            <p className="text-md">{endpoint.id}</p>
            {clipboard.id.didCopy ? (
              <div className="flex items-center text-sm">
                <ClipboardDocumentCheckIcon
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

          <p className="flex items-center text-sm text-gray-500">
            <LinkIcon
              className="mr-1.5 h-6 w-6 flex-shrink-0 text-gray-400"
              aria-hidden="true"
            />
            <span className="font-mono">{endpoint.url}</span>
          </p>

          <div className="flex justify-between">
            <div className="flex items-center text-sm text-gray-500">
              <CalendarIcon
                className="mr-1.5 h-6 w-6 flex-shrink-0 text-gray-400"
                aria-hidden="true"
              />
              <p>
                Created{' '}
                <time dateTime={endpoint.created_at}>
                  {date.format(
                    new Date(endpoint.created_at),
                    'yyyy/MM/dd HH:MM',
                  )}
                </time>
              </p>
            </div>

            <div className="flex space-x-2">
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

              <IconButton onClick={() => onEdit(endpoint)}>
                <PencilSquareIcon className="h-6 w-6" />
              </IconButton>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};
