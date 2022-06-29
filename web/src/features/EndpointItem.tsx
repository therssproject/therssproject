import {LinkIcon} from '@heroicons/react/outline';
import {CalendarIcon} from '@heroicons/react/solid';
import * as date from 'date-fns';

import {Endpoint} from '@/models/endpoint';

export const EndpointItem = ({endpoint}: {endpoint: Endpoint}) => {
  return (
    <li>
      <div className="block hover:bg-gray-50">
        <div className="space-y-2 px-4 py-4 sm:px-6">
          <p className="text-md truncate font-medium text-indigo-600">
            {endpoint.title}
          </p>

          <p className="flex items-center text-sm text-gray-500">
            <LinkIcon
              className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400"
              aria-hidden="true"
            />
            <span className="font-mono">{endpoint.url}</span>
          </p>

          <div className="flex items-center text-sm text-gray-500">
            <CalendarIcon
              className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400"
              aria-hidden="true"
            />
            <p>
              Created{' '}
              <time dateTime={endpoint.created_at}>
                {date.format(new Date(endpoint.created_at), 'yyyy/MM/dd HH:MM')}
              </time>
            </p>
          </div>
        </div>
      </div>
    </li>
  );
};
