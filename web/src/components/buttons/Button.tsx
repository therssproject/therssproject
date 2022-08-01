import * as React from 'react';
import {ImSpinner2} from 'react-icons/im';

import {clsxm} from '@/lib/clsxm';

export type ButtonVariant =
  | 'primary'
  | 'outline'
  | 'ghost'
  | 'light'
  | 'dark'
  | 'danger';

type Props = {
  isLoading?: boolean;
  isDarkBg?: boolean;
  isFullWidth?: boolean;
  variant?: ButtonVariant;
} & React.ComponentPropsWithRef<'button'>;

type ButtonClsxm = {
  variant: ButtonVariant;
  isDarkBg: boolean;
  isLoading: boolean;
  isFullWidth: boolean;
  className: string;
};

export const buttonClsxm = ({
  variant,
  isDarkBg,
  isLoading,
  isFullWidth,
  className,
}: ButtonClsxm) =>
  clsxm(
    'inline-flex items-center rounded-md px-3 py-2 shadow-sm',
    'text-sm font-medium leading-4',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'border border-transparent',
    'transition-colors duration-75',
    [
      variant === 'primary' && [
        'bg-cyan-500 text-white',
        'focus-visible:ring-cyan-500',
        'hover:bg-cyan-600 hover:text-white',
        'active:bg-cyan-500',
        'disabled:bg-cyan-400 disabled:hover:bg-cyan-400',
      ],
      variant === 'danger' && [
        'bg-red-500 text-white',
        'focus-visible:ring-red-500',
        'hover:bg-red-600 hover:text-white',
        'active:bg-red-500',
        'disabled:bg-red-300 disabled:hover:bg-red-200',
      ],
      variant === 'outline' && [
        'text-cyan-500',
        'focus-visible:ring-cyan-500',
        'hover:bg-cyan-50 active:bg-cyan-100 disabled:bg-cyan-100',
        isDarkBg && 'hover:bg-gray-900 active:bg-gray-800 disabled:bg-gray-800',
      ],
      variant === 'ghost' && [
        'text-cyan-500',
        'shadow-none',
        'hover:bg-cyan-50 active:bg-cyan-100 disabled:bg-cyan-100',
        isDarkBg && 'hover:bg-gray-900 active:bg-gray-800 disabled:bg-gray-800',
      ],
      variant === 'light' && [
        'bg-white text-dark ',
        'focus-visible:ring-gray-200',
        'hover:bg-gray-100 hover:text-dark',
        'active:bg-white/80 disabled:bg-gray-200',
      ],
      variant === 'dark' && [
        'bg-gray-900 text-white',
        'focus-visible:ring-cyan-900',
        'hover:bg-gray-800 active:bg-gray-700 disabled:bg-gray-700',
      ],
    ],
    'disabled:cursor-not-allowed',
    isLoading &&
      'relative text-transparent transition-none hover:text-transparent disabled:cursor-wait',
    isFullWidth && 'flex w-full justify-center',
    className,
  );

export const Button = React.forwardRef<HTMLButtonElement, Props>(
  (
    {
      children,
      className = '',
      disabled: buttonDisabled,
      isLoading = false,
      variant = 'primary',
      isDarkBg = false,
      isFullWidth = false,
      ...rest
    },
    ref,
  ) => {
    const disabled = isLoading || buttonDisabled;

    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        className={buttonClsxm({
          variant,
          isDarkBg,
          isFullWidth,
          isLoading,
          className,
        })}
        {...rest}
      >
        {isLoading && (
          <div
            className={clsxm(
              'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
              {
                'text-white': ['primary', 'dark'].includes(variant),
                'text-black': ['light'].includes(variant),
                'text-cyan-500': ['outline', 'ghost'].includes(variant),
              },
            )}
          >
            <ImSpinner2 className="animate-spin" />
          </div>
        )}
        {children}
      </button>
    );
  },
);
