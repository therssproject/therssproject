import {yupResolver} from '@hookform/resolvers/yup';
import {pipe} from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import {useState} from 'react';
import {SubmitHandler, useForm} from 'react-hook-form';
import * as yup from 'yup';

import {Button} from '@/components/buttons/Button';
import {TextField} from '@/components/inputs/TextField';
import {SlideOver} from '@/components/SlideOver';

import {
  CreateEndpoint as CreateEndpointBody,
  createEndpoint,
  useSetNewEndpoint,
} from '@/models/endpoint';

const CreateEndpoint_ = yup.object({
  title: yup.string().required(),
  url: yup.string().url().required(),
});

type Props = {
  app: string;
  open: boolean;
  onClose: () => void;
};

export const Create = ({app, open, onClose}: Props) => {
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: {errors},
  } = useForm<CreateEndpointBody>({resolver: yupResolver(CreateEndpoint_)});

  const setNewEndpoint = useSetNewEndpoint();

  const doClose = () => {
    if (!loading) {
      onClose();
      reset();
    }
  };

  const onSubmit: SubmitHandler<CreateEndpointBody> = async (body) => {
    setLoading(true);

    const run = pipe(
      createEndpoint(app, body),
      TE.match(
        (err) => {
          // eslint-disable-next-line no-console
          console.log(err);
        },
        (newEndpoint) => {
          setNewEndpoint(newEndpoint);
          doClose();
        },
      ),
    );

    await run();

    setLoading(false);
  };

  return (
    <SlideOver open={open} onClose={doClose}>
      <form
        className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="flex-1">
          {/* Header */}
          <SlideOver.Header
            title="Create endpoint"
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
              Create
            </Button>
          </div>
        </div>
      </form>
    </SlideOver>
  );
};
