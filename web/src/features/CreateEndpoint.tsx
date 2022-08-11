import {yupResolver} from '@hookform/resolvers/yup';
import {pipe} from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import {useState} from 'react';
import {SubmitHandler, useForm} from 'react-hook-form';
import * as yup from 'yup';

import {FetchError} from '@/lib/fetch';
import {Route} from '@/lib/routes';

import {Button} from '@/components/buttons/Button';
import {TextField} from '@/components/inputs/TextField';
import {PrimaryLink} from '@/components/links/PrimaryLink';
import {SlideOver} from '@/components/SlideOver';
import {Terminal} from '@/components/Terminal';

import * as SNIPPETS from '@/content/snippets';
import {
  Endpoint,
  RegisterEndpoint as RegisterEndpointBody,
  registerEndpoint,
  updateEndpoint,
  useSetNewEndpoint,
  useUpdateEndpoint,
} from '@/models/endpoint';
import {external} from '@/lib/href';

type RegisterProps = {
  app: string;
  onClose: () => void;
};

const register = (app: string, body: RegisterEndpointBody) =>
  pipe(
    registerEndpoint(app, body),
    TE.map((res) => res.data),
  );

export const Register = (props: RegisterProps) => {
  const onSave = useSetNewEndpoint();

  return <Form {...props} onSave={onSave} doSave={register} />;
};

type UpdateProps = {
  endpoint: Endpoint;
  app: string;
  onClose: () => void;
};

export const Update = (props: UpdateProps) => {
  const onSave = useUpdateEndpoint(props.endpoint);

  return (
    <Form
      {...props}
      onSave={onSave}
      doSave={(app, body) => updateEndpoint(app, props.endpoint, body)}
    />
  );
};

const RegisterEndpoint_ = yup.object({
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
    body: RegisterEndpointBody,
  ) => TE.TaskEither<FetchError, Endpoint>;
};

const Form = ({endpoint, app, onClose, onSave, doSave}: Props) => {
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: {errors},
  } = useForm<RegisterEndpointBody>({
    resolver: yupResolver(RegisterEndpoint_),
    defaultValues: endpoint,
  });

  const doClose = () => {
    if (!loading) {
      onClose();
      reset();
    }
  };

  const onSubmit: SubmitHandler<RegisterEndpointBody> = async (body) => {
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
          title={endpoint ? 'Update endpoint' : 'Register endpoint'}
          description="Webhook endpoint for your subscriptions"
        />

        <div className="space-y-6 py-6 sm:space-y-0 sm:py-0">
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
        </div>
      </div>

      <div className="flex-shrink-0">
        {/* Mobile version */}
        <div className="p-6 md:hidden">
          <p className="text-sm text-gray-600">
            Want to register endpoints using the API instead?{' '}
            <PrimaryLink
              href={external(
                'https://docs.therssproject.com/get-started/endpoints',
              )}
            >
              Check the docs
            </PrimaryLink>{' '}
          </p>
        </div>

        {/* Others */}
        <div className="hidden space-y-4 p-6 md:block">
          <h3 className="text-lg font-medium text-gray-600">
            Or using the API
          </h3>

          <Terminal
            id="registerEndpoint"
            snippet={SNIPPETS.registerEndpoint}
            from="create_form"
          />

          <p className="text-sm text-gray-600">
            Go to{' '}
            <PrimaryLink href={Route.appSettingsKeys(app)}>
              Settings {'>'} Keys
            </PrimaryLink>{' '}
            to generate API Keys for this application.
          </p>
        </div>

        {/* Action buttons */}
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
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
              {endpoint ? 'Update' : 'Register'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
};
