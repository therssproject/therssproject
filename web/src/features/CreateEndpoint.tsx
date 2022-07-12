import {yupResolver} from '@hookform/resolvers/yup';
import {pipe} from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import {useState} from 'react';
import {SubmitHandler, useForm} from 'react-hook-form';
import * as yup from 'yup';

import {FetchError} from '@/lib/fetch';

import {Button} from '@/components/buttons/Button';
import {TextField} from '@/components/inputs/TextField';
import {SlideOver} from '@/components/SlideOver';
import {Terminal} from '@/components/Terminal';

import {
  CreateEndpoint as CreateEndpointBody,
  createEndpoint,
  Endpoint,
  updateEndpoint,
  useSetNewEndpoint,
  useUpdateEndpoint,
} from '@/models/endpoint';

type CreateProps = {
  app: string;
  onClose: () => void;
};

export const Create = (props: CreateProps) => {
  const onSave = useSetNewEndpoint();

  return <Form {...props} onSave={onSave} doSave={createEndpoint} />;
};

type EditProps = {
  endpoint: Endpoint;
  app: string;
  onClose: () => void;
};

export const Edit = (props: EditProps) => {
  const onSave = useUpdateEndpoint(props.endpoint);

  return (
    <Form
      {...props}
      onSave={onSave}
      doSave={(app, body) => updateEndpoint(app, props.endpoint, body)}
    />
  );
};

const CreateEndpoint_ = yup.object({
  title: yup.string().required(),
  url: yup.string().url().required(),
});

type Props = {
  endpoint?: Endpoint;
  app: string;
  onClose: () => void;
  onSave: (endpoint: Endpoint) => void;
  doSave: (
    app: string,
    body: CreateEndpointBody,
  ) => TE.TaskEither<FetchError, Endpoint>;
};

const Form = ({endpoint, app, onClose, onSave, doSave}: Props) => {
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: {errors},
  } = useForm<CreateEndpointBody>({
    resolver: yupResolver(CreateEndpoint_),
    defaultValues: endpoint,
  });

  const doClose = () => {
    if (!loading) {
      onClose();
      reset();
    }
  };

  const onSubmit: SubmitHandler<CreateEndpointBody> = async (body) => {
    setLoading(true);

    const run = pipe(
      doSave(app, body),
      TE.match(
        (err) => {
          // eslint-disable-next-line no-console
          console.log(err);
        },
        (newEndpoint) => {
          onSave(newEndpoint);
          doClose();
        },
      ),
    );

    await run();

    setLoading(false);
  };

  return (
    <form
      className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="flex-1">
        {/* Header */}
        <SlideOver.Header
          title={endpoint ? 'Edit endpoint' : 'Create endpoint'}
          description="Webhook endpoint for your subscriptions"
        />

        <div className="space-y-6 py-6 sm:space-y-0 sm:divide-y sm:divide-gray-200 sm:py-0">
          {/* Title */}
          <div className="p-6">
            <TextField
              label="Title"
              input={{
                id: 'title',
                placeholder: 'My title',
                variant: errors.title ? 'error' : 'default',
                ...register('title'),
              }}
            />
          </div>

          {/* URL */}
          <div className="p-6">
            <TextField
              label="Webhook Endpoint URL"
              input={{
                id: 'url',
                placeholder: 'https://sub.domain.com/webhooks/rss',
                variant: errors.url ? 'error' : 'default',
                ...register('url'),
              }}
            />
          </div>

          <div className="space-y-6 p-6">
            <div className="text-lg font-medium text-gray-900">
              Create endpoints using the API
            </div>
            <Terminal>
              {`curl https://api.therssproject.com/application/endpoint \\\n--data { "foo": "bar" }`}
            </Terminal>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex-shrink-0 border-t border-gray-200 px-4 py-5 sm:px-6">
        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={doClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {endpoint ? 'Save' : 'Create'}
          </Button>
        </div>
      </div>
    </form>
  );
};
