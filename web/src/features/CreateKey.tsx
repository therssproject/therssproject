import {Dialog, Transition} from '@headlessui/react';
import {
  CheckIcon,
  ClipboardCheckIcon,
  ClipboardIcon,
  KeyIcon,
} from '@heroicons/react/outline';
import {yupResolver} from '@hookform/resolvers/yup';
import {pipe} from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import {Fragment, useRef, useState} from 'react';
import {SubmitHandler, useForm} from 'react-hook-form';
import * as yup from 'yup';

import {useCopyToClipboard} from '@/lib/clipboard';

import {Button} from '@/components/buttons/Button';
import {TextField} from '@/components/inputs/TextField';
import {useToast} from '@/components/Toast';

import {Application} from '@/models/application';
import {
  CreateKey as CreateKeyBody,
  createKey,
  Key,
  useSetNewKey,
  CreateKey,
  CreatedKey,
} from '@/models/key';
import {Alert} from '@/components/Alert';

type Props = {
  app: Application;
  open: boolean;
  onClose: () => void;
};

const Inputs = yup.object({
  title: yup.string().required('Please provide a title for the new key'),
});

type Status = {tag: 'create'} | {tag: 'creating'} | {tag: 'confirm'; key: CreatedKey};

const create: Status = {tag: 'create'};
const creating: Status = {tag: 'creating'};
const confirm = (key: CreatedKey): Status => ({tag: 'confirm', key});

export const Create = ({open, app, onClose}: Props) => {
  const {copy, didCopy} = useCopyToClipboard();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const setNewKey = useSetNewKey();
  const [status, setStatus] = useState<Status>(create);

  const {
    register,
    handleSubmit,
    reset,
    formState: {errors},
  } = useForm<CreateKeyBody>({resolver: yupResolver(Inputs)});

  const onSubmit: SubmitHandler<CreateKeyBody> = async (body) => {
    setStatus(creating);

    const run = pipe(
      createKey(app.id, body),
      TE.match(
        () => {
          setStatus(create);
          toast.show('Failed to create key', {variant: 'danger'});
        },
        ({ key, ...rest }) => {
          setStatus(confirm({key, ...rest}));
          setNewKey(rest);
          reset();
        },
      ),
    );

    run();
  };

  const doClose = () => {
    onClose();

    // Allow the fade-out to play
    setTimeout(() => {
      reset();
      setStatus(create);
    }, 500);
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-10"
        initialFocus={inputRef}
        onClose={() => {
          if (status.tag === 'create') {
            doClose();
          }
        }}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                {status.tag === 'confirm' ? (
                  <>
                    <div className="space-y-4 bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                      <div className="sm:flex sm:items-start">
                        <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                          <CheckIcon
                            className="h-6 w-6 text-green-600"
                            aria-hidden="true"
                          />
                        </div>
                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                          <Dialog.Title
                            as="h3"
                            className="text-lg font-medium leading-6 text-gray-900"
                          >
                            API Key Created
                          </Dialog.Title>
                          <div className="mt-2">
                            <p className="text-sm text-gray-500">
                              The key will be used to interact with the{' '}
                              <code>therssproject</code> API on behalf of this
                              application.
                            </p>
                          </div>
                        </div>
                      </div>

                      <Alert variant="danger">
                        You will not be able to copy the key afterwards.
                      </Alert>

                      <div>
                        <TextField
                          input={{
                            variant: 'success',
                            value: status.key.key,
                            iconAfter: {
                              onClick: () =>
                                copy(status.key.key, () =>
                                  toast.show('Key copied to clipboard'),
                                ),
                              component: didCopy
                                ? ClipboardCheckIcon
                                : ClipboardIcon,
                            },
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 bg-gray-50 px-4 py-3 sm:px-6">
                      <Button onClick={doClose} variant="primary">
                        I have copied the key
                      </Button>
                    </div>
                  </>
                ) : (
                  <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-4 bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                      <div className="sm:flex sm:items-start">
                        <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                          <KeyIcon
                            className="h-6 w-6 text-yellow-600"
                            aria-hidden="true"
                          />
                        </div>
                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                          <Dialog.Title
                            as="h3"
                            className="text-lg font-medium leading-6 text-gray-900"
                          >
                            Create API Key
                          </Dialog.Title>
                          <div className="mt-2">
                            <p className="text-sm text-gray-500">
                              The key will be used to interact with the{' '}
                              <code>therssproject</code> API on behalf of this
                              application.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <TextField
                          ref={inputRef}
                          input={{
                            id: 'key_title',
                            placeholder: 'My key ...',
                            variant: errors.title ? 'error' : 'default',
                            ...register('title'),
                          }}
                          message={errors.title?.message}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 bg-gray-50 px-4 py-3 sm:px-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={doClose}
                        disabled={status.tag === 'creating'}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={status.tag === 'creating'}
                      >
                        Create
                      </Button>
                    </div>
                  </form>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
