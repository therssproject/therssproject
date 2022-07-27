import {FC} from 'react';
import {RssIcon} from '@heroicons/react/outline';
import {clsxm} from '@/lib/clsxm';

type Props = {
  className: string;
};

export const Rss: FC<Props> = ({className}) => (
  <div
    className={clsxm(
      'flex flex-shrink-0 items-center justify-center rounded-full bg-gray-700',
      className,
    )}
  >
    <RssIcon className="h-2/3 w-2/3 text-gray-200" />
  </div>
);
