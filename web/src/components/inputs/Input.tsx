import {ComponentPropsWithRef, ComponentType, forwardRef} from 'react';
import {match} from 'ts-pattern';

import {clsxm} from '@/lib/clsxm';

type InputVariant = 'default' | 'error' | 'success';

type Icon = {
  onClick?: () => void;
  component: ComponentType<{className: string}>;
};

type IconProps = {
  position: 'before' | 'after';
  disabled?: boolean;
  variant: InputVariant;
} & Icon;

const InputIcon = ({
  position,
  component: Icon,
  onClick,
  disabled,
  variant,
}: IconProps) => (
  <button
    type="button"
    // Disable `tab` navigation when no handler or the input is disabled
    tabIndex={onClick ? undefined : -1}
    onClick={onClick}
    disabled={disabled}
    className={clsxm(
      'absolute inset-y-0 flex items-center px-3',
      'rounded-lg focus:outline-none focus-visible:ring',
      'focus-visible:border-gray-500',
      Boolean(onClick) && !disabled ? 'cursor-pointer' : 'pointer-events-none',
      match(position)
        .with('before', () => 'left-0')
        .with('after', () => 'right-0')
        .exhaustive(),

      match(variant ?? 'default')
        .with('default', () => ['focus-visible:ring-gray-500'])
        .with('error', () => ['focus-visible:ring-red-500'])
        .with('success', () => ['focus-visible:ring-green-500'])
        .exhaustive(),
    )}
  >
    <Icon
      className={clsxm(
        'h-5 w-5',
        match(variant ?? 'default')
          .with('default', () => ['text-gray-500', 'disabled:text-gray-400'])
          .with('error', () => ['text-red-500', 'disabled:text-red-400'])
          .with('success', () => ['text-green-500', 'disabled:text-green-400'])
          .exhaustive(),
      )}
    />
  </button>
);

export type Props = {
  variant?: InputVariant;
  iconBefore?: Icon;
  iconAfter?: Icon;
} & ComponentPropsWithRef<'input'>;

export const Input = forwardRef<HTMLInputElement, Props>(
  ({variant = 'default', iconBefore, iconAfter, className, ...rest}, ref) => (
    <div className="relative mt-1 rounded-lg">
      {iconBefore ? (
        <InputIcon
          position="before"
          variant={variant}
          disabled={rest.disabled}
          component={iconBefore.component}
          onClick={iconBefore.onClick}
        />
      ) : null}

      <input
        ref={ref}
        type="text"
        className={clsxm(
          'block w-full appearance-none rounded-lg',
          'border-2 p-3 focus:outline-none sm:text-sm',
          'disabled:cursor-not-allowed',

          iconAfter && 'pr-12',
          iconBefore && 'pl-12',

          match(variant)
            .with('default', () => [
              'bg-gray-50',
              'border-gray-300',
              'placeholder-gray-500',
              'text-gray-900',
              'disabled:placeholder-gray-400',
              'disabled:text-gray-400',
              'focus:border-main',
              'focus:ring-main',
            ])
            .with('error', () => [
              'bg-red-50',
              'border-red-300',
              'placeholder-red-500',
              'text-red-700',
              'disabled:placeholder-red-400',
              'disabled:text-red-400',
              'focus:border-red-500',
              'focus:ring-red-500',
            ])
            .with('success', () => [
              'bg-green-50',
              'border-green-300',
              'placeholder-green-500',
              'text-green-700',
              'disabled:placeholder-green-400',
              'disabled:text-green-400',
              'focus:border-green-500',
              'focus:ring-green-500',
            ])
            .exhaustive(),

          className,
        )}
        {...rest}
      />

      {iconAfter ? (
        <InputIcon
          position="after"
          variant={variant}
          disabled={rest.disabled}
          component={iconAfter.component}
          onClick={iconAfter.onClick}
        />
      ) : null}
    </div>
  ),
);
