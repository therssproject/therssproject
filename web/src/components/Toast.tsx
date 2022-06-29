import * as A from 'fp-ts/Array';
import {pipe} from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import {ReactNode} from 'react';
import * as Toast from 'react-hot-toast';

import {Alert, Props as AlertProps} from './Alert';

const remove = (id: string) => Toast.toast.remove(id);
const removeAll = () => Toast.toast.remove();

type ToastOptions = {
  onClose?: true | (() => void);
  duration?: number;
  position?: Toast.ToastOptions['position'];
  variant?: AlertProps['variant'];
};

const toast_ = (content: ReactNode, opts?: ToastOptions & {id?: string}) => {
  const {
    variant,
    id,
    duration = 4000,
    position = 'bottom-right',
    onClose,
  }: ToastOptions & {id?: string} = opts ?? {};

  return Toast.toast.custom(
    (t) => (
      <Alert
        variant={variant}
        className="shadow-md sm:max-w-xl"
        onDismiss={
          onClose === true
            ? () => remove(t.id)
            : onClose
            ? () => {
                remove(t.id);
                onClose();
              }
            : undefined
        }
      >
        {content}
      </Alert>
    ),
    {id, duration, position},
  );
};

const show = (content: ReactNode, props?: ToastOptions): string =>
  toast_(content, props);

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noOp = () => {};

export const useToast = () => {
  const {toasts} = Toast.useToasterStore();

  const showUnique = (id: string, content: ReactNode, props?: ToastOptions) => {
    pipe(
      toasts,
      A.findFirst((t) => t.id === id),
      // Only create the toast when it doesn't existing or it is NOT visible
      O.filter((t) => t.visible),
      O.match(() => {
        toast_(content, {id, ...props});
      }, noOp),
    );
  };

  const update = (id: string, content: ReactNode, props?: ToastOptions) => {
    pipe(
      toasts,
      A.findFirst((t) => t.id === id),
      // Only call toast_when the toast with `id` is visible
      O.filter((t) => t.visible),
      O.match(noOp, () => {
        toast_(content, {id, ...props});
      }),
    );
  };

  return {
    show,
    showUnique,
    update,
    remove,
    removeAll,
  };
};
