import {ComponentPropsWithRef, forwardRef, ReactNode} from 'react';

export type Props = {
  children: ReactNode;
  className?: string;
} & ComponentPropsWithRef<'button'>;

export const UnstyledButton = forwardRef<HTMLButtonElement, Props>(
  ({children, ...rest}, ref) => (
    <button ref={ref} type="button" {...rest}>
      {children}
    </button>
  ),
);
