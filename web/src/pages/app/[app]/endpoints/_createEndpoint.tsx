import {yupResolver} from '@hookform/resolvers/yup';
import {pipe} from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import {useState} from 'react';
import {SubmitHandler, useForm} from 'react-hook-form';
import * as yup from 'yup';

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

export const CreateEndpoint = ({app, open, onClose}: Props) => {
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    // TODO: show errors when InlineField component is created
    // formState: {error},
  } = useForm<CreateEndpointBody>({resolver: yupResolver(CreateEndpoint_)});

  const setNewEndpoint = useSetNewEndpoint();

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
          onClose();
        },
      ),
    );

    await run();

    setLoading(true);
  };

  return (
    <SlideOver
      open={open}
      onClose={() => {
        if (!loading) {
          onClose();
        }
      }}
    >
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
            <div className="space-y-1 px-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:space-y-0 sm:px-6 sm:py-5">
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-900 sm:mt-px sm:pt-2"
                >
                  Title
                </label>
              </div>
              <div className="sm:col-span-2">
                <input
                  type="text"
                  id="title"
                  placeholder="My endpoint"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  {...register('title')}
                />
              </div>
            </div>

            {/* URL */}
            <div className="space-y-1 px-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:space-y-0 sm:px-6 sm:py-5">
              <div>
                <label
                  htmlFor="url"
                  className="block text-sm font-medium text-gray-900 sm:mt-px sm:pt-2"
                >
                  Endpoint URL
                </label>
              </div>
              <div className="sm:col-span-2">
                <input
                  type="text"
                  id="url"
                  placeholder="https://sub.domain.com/webhooks/rss"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  {...register('url')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex-shrink-0 border-t border-gray-200 px-4 py-5 sm:px-6">
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              disabled={loading}
            >
              Create
            </button>
          </div>
        </div>
      </form>
    </SlideOver>
  );
};
