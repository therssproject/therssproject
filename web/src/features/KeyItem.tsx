import {CalendarIcon, CheckIcon, TrashIcon} from '@heroicons/react/outline';
import * as date from 'date-fns';
import {useState} from 'react';

import {IconButton} from '@/components/buttons/IconButton';

import {Key} from '@/models/key';

type Props = {key_: Key, onDelete: (key: Key) => void}

export const KeyItem = ({key_, onDelete}: Props) => {
  const [confirm, setConfirm] = useState(false);
  const createdAt = new Date(key_.created_at);

  const onDeleteClick = () => {
    if (confirm) {
      onDelete(key_);
    } else {
      setConfirm(true);
    }
  };

  return (
    <li>
      <div className="block hover:bg-gray-50">
        <div className="flex items-center px-4 py-4 sm:px-6">
          <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
            <div className="truncate">
              <div className="flex text-sm">
                <p className="truncate font-medium text-indigo-600">
                  {key_.title}
                </p>
              </div>
              <div className="mt-2 flex">
                <div className="flex items-center text-sm text-gray-500">
                  <CalendarIcon
                    className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400"
                    aria-hidden="true"
                  />
                  <p>
                    Created{' '}
                    <time
                      dateTime={key_.created_at}
                      title={date.format(createdAt, 'yyyy/MM/dd HH:MM')}
                    >
                      {date.formatRelative(createdAt, Date.now())}
                    </time>
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="ml-5 flex-shrink-0">
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
