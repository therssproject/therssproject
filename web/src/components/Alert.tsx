import {XIcon} from '@heroicons/react/solid';
import {ReactNode} from 'react';
import {match} from 'ts-pattern';

import {clsxm} from '@/lib/clsxm';

type AlertVariant = 'success' | 'danger' | 'info' | 'warning';

export type Props = {
  children: ReactNode;
  variant?: AlertVariant;
  onDismiss?: () => void;
  className?: string;
};

export const Alert = ({
  children,
  variant = 'info',
  onDismiss,
  className,
}: Props) => {
  const text = match(variant ?? 'info')
    .with('success', () => ['text-green-700'])
    .with('danger', () => ['text-red-700'])
    .with('info', () => ['text-primary-700'])
    .with('warning', () => ['text-orange-700'])
    .exhaustive();

  return (
    <article
      className={clsxm(
        'relative flex rounded-md',
        onDismiss && 'pr-8',
        match(variant ?? 'info')
          .with('success', () => ['bg-green-100'])
          .with('danger', () => ['bg-red-100'])
          .with('info', () => ['bg-primary-100'])
          .with('warning', () => ['bg-orange-100'])
          .exhaustive(),
        className,
      )}
    >
      <div className={clsxm('space-y-2 p-4', text)}>{children}</div>
      {onDismiss ? (
        <button
          type="button"
          className="absolute top-3 right-3"
          onClick={onDismiss}
        >
          <XIcon className={clsxm('h-5 w-5', text)} />
        </button>
      ) : null}
    </article>
  );
};
