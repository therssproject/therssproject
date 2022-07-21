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
  GeneratedKey,
  GenerateKey as GenerateKeyBody,
  generateKey,
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
  | {tag: 'generate'}
  | {tag: 'generating'}
  | {tag: 'confirm'; key: GeneratedKey};

const generate: Status = {tag: 'generate'};
const generating: Status = {tag: 'generating'};
const confirm = (key: GeneratedKey): Status => ({tag: 'confirm', key});

export const Generate = ({open, app, onClose}: Props) => {
  const {copy, didCopy} = useCopyToClipboard();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const setNewKey = useSetNewKey();
  const [status, setStatus] = useState<Status>(generate);

  const {
    register,
    handleSubmit,
    reset,
    formState: {errors},
  } = useForm<GenerateKeyBody>({resolver: yupResolver(Inputs)});

  const onSubmit: SubmitHandler<GenerateKeyBody> = async (body) => {
    setStatus(generating);

    const run = pipe(
      generateKey(app.id, body),
      TE.match(
        () => {
          setStatus(generate);
          toast.show('Failed to generate key', {variant: 'danger'});
        },
        ({data: {key, ...rest}}) => {
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
      setStatus(generate);
    }, 500);
  };

  const safeClose = () => {
    if (status.tag === 'generate') {
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
              title="API Key Generated"
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
                      onClick: () => copy(status.key.key),
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
              title="Generate API Key"
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
                disabled={status.tag === 'generating'}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={status.tag === 'generating'}>
                Generate
              </Button>
            </div>
          </div>
        </form>
      )}
    </SlideOver>
  );
};
