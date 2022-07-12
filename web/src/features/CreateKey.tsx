import {
  CheckIcon,
  ClipboardCheckIcon,
  ClipboardIcon,
  KeyIcon,
} from '@heroicons/react/outline';
import {yupResolver} from '@hookform/resolvers/yup';
import {pipe} from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import {useRef, useState} from 'react';
import {SubmitHandler, useForm} from 'react-hook-form';
import * as yup from 'yup';

import {useCopyToClipboard} from '@/lib/clipboard';

import {Alert} from '@/components/Alert';
import {Button} from '@/components/buttons/Button';
import {TextField} from '@/components/inputs/TextField';
import {SlideOver} from '@/components/SlideOver';
import {useToast} from '@/components/Toast';

import {Application} from '@/models/application';
import {
  CreatedKey,
  CreateKey as CreateKeyBody,
  createKey,
  useSetNewKey,
} from '@/models/key';

type Props = {
  app: Application;
  open: boolean;
  onClose: () => void;
};

const Inputs = yup.object({
  title: yup.string().required('Please provide a title for the new key'),
});

type Status =
  | {tag: 'create'}
  | {tag: 'creating'}
  | {tag: 'confirm'; key: CreatedKey};

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
        ({key, ...rest}) => {
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

  const safeClose = () => {
    if (status.tag === 'create') {
      doClose();
    }
  };

  return (
    <SlideOver open={open} onClose={safeClose}>
      {status.tag === 'confirm' ? (
        <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
          <div className="flex-1">
            <SlideOver.Header
              icon={{
                variant: 'success',
                Component: CheckIcon,
              }}
              title="API Key Created"
              description={
                <>
                  The key will be used to interact with the{' '}
                  <code>therssproject</code> API on behalf of this application.
                </>
              }
            />

            <div className="space-y-6 p-6">
              <Alert variant="warning">
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
                      component: didCopy ? ClipboardCheckIcon : ClipboardIcon,
                    },
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 border-t border-gray-200 px-4 py-5 sm:px-6">
            <div className="flex justify-end space-x-3">
              <Button onClick={doClose} variant="primary">
                I have copied the key
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl"
        >
          <div className="flex-1">
            <SlideOver.Header
              icon={{
                variant: 'warn',
                Component: KeyIcon,
              }}
              title="Create API Key"
              description={
                <>
                  The key will be used to interact with the{' '}
                  <code>therssproject</code> API on behalf of this application.
                </>
              }
            />

            <div className="space-y-6 p-6">
              <div>
                <TextField
                  ref={inputRef}
                  label="Key title"
                  input={{
                    id: 'key_title',
                    placeholder: 'Subscription automation',
                    variant: errors.title ? 'error' : 'default',
                    ...register('title'),
                  }}
                  message={errors.title?.message}
                />
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 border-t border-gray-200 px-4 py-5 sm:px-6">
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={doClose}
                disabled={status.tag === 'creating'}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={status.tag === 'creating'}>
                Create
              </Button>
            </div>
          </div>
        </form>
      )}
    </SlideOver>
  );
};
