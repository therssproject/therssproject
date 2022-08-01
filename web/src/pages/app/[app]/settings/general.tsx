import {Dialog, Transition} from '@headlessui/react';
import {pipe} from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import * as TE from 'fp-ts/TaskEither';
import {useSetAtom} from 'jotai';
import {Fragment} from 'react';
import {useState} from 'react';

import {useAtom} from '@/lib/jotai';

import {Alert} from '@/components/Alert';
import {Button} from '@/components/buttons/Button';
import {Input} from '@/components/inputs/Input';
import {Layout} from '@/components/layout/Layout';
import {Tabs} from '@/components/SettingsTabs';
import {useToast} from '@/components/Toast';

import {
  Application,
  resetApp,
  SelectedAppAtom,
  StatsAtom,
  useRefetchAppData,
} from '@/models/application';
import {EndpointsAtom} from '@/models/endpoint';
import {LogsAtom} from '@/models/log';
import {SubscriptionsAtom} from '@/models/subscription';
import {NextPageWithLayout} from '@/pages/_app';

type Confirm = {tag: 'closed'} | {tag: 'open'; confirmation: string};

const closed: Confirm = {tag: 'closed'};
const open: Confirm = {tag: 'open', confirmation: ''};

const AppSettingsGeneral: NextPageWithLayout = () => {
  const {refetchAppData} = useRefetchAppData();
  const [currentApp, _setCurrentApp] = useAtom(SelectedAppAtom);

  const [confirm, setConfirm] = useState<Confirm>(closed);
  const toast = useToast();

  const setSubscriptions = useSetAtom(SubscriptionsAtom);
  const setLogs = useSetAtom(LogsAtom);
  const setEndpoints = useSetAtom(EndpointsAtom);
  const setStats = useSetAtom(StatsAtom);

  const closeModal = () => {
    setConfirm(closed);
  };

  const openModal = () => {
    setConfirm(open);
  };

  const onConfirmChange = (value: string) => {
    if (confirm.tag === 'open') {
      setConfirm({tag: 'open', confirmation: value});
    }
  };

  const onReset = (app: Application) => {
    if (confirm.tag === 'closed' || confirm.confirmation !== app.name) {
      return;
    }

    closeModal();

    const run = pipe(
      resetApp(app.id),
      TE.match(
        () => {
          toast.show('Failed to reset application', {variant: 'danger'});
        },
        () => {
          toast.show(
            'Reset application started. It can take a few minutes to reset everything',
          );

          setSubscriptions({});
          setLogs({});
          setEndpoints({});
          setStats(O.none);

          // TODO: should it refetch
          //       or just set the initial state with empty data
          refetchAppData();
        },
      ),
    );

    run();
  };

  return pipe(
    currentApp,
    O.match(
      () => null,
      (app) => (
        <div className="space-y-8">
          <Tabs app={app.id} />

          <div className="mt-5 md:col-span-2 md:mt-0">
            <div className="shadow sm:overflow-hidden sm:rounded-md">
              <div className="space-y-8 bg-white px-4 py-5 sm:p-6">
                <h3 className="text-lg font-bold leading-6 text-red-700">
                  Danger Zone
                </h3>

                <div className="flex items-end justify-between">
                  <div className="space-y-2">
                    <p className="font-bold text-gray-700">Reset application</p>
                    <p className="text-gray-700">
                      Remove all the endpoints, subscriptions, webhook event
                      logs, and API keys.
                    </p>
                  </div>

                  <Button variant="danger" onClick={openModal}>
                    Reset application
                  </Button>
                </div>

                <ConfirmModal
                  app={app}
                  confirm={confirm}
                  closeModal={closeModal}
                  onChange={onConfirmChange}
                  onReset={() => onReset(app)}
                />
              </div>
            </div>
          </div>
        </div>
      ),
    ),
  );
};

AppSettingsGeneral.getLayout = (page) => (
  <Layout variant="applications" title="Settings" seo={{}}>
    {page}
  </Layout>
);

export default AppSettingsGeneral;

type ConfirmModalProps = {
  app: Application;
  confirm: Confirm;
  closeModal: () => void;
  onChange: (value: string) => void;
  onReset: () => void;
};

const ConfirmModal = ({
  app,
  confirm,
  closeModal,
  onChange,
  onReset,
}: ConfirmModalProps) => (
  <Transition appear show={confirm.tag === 'open'} as={Fragment}>
    <Dialog as="div" className="relative z-10" onClose={closeModal}>
      <Transition.Child
        as={Fragment}
        enter="ease-out duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="ease-in duration-200"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="fixed inset-0 bg-black bg-opacity-25" />
      </Transition.Child>

      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
              <Dialog.Title
                as="h3"
                className="text-2xl font-medium leading-6 text-gray-900"
              >
                Are you sure?
              </Dialog.Title>

              <div className="mt-6 space-y-4">
                <Alert variant="danger">This action cannot be reverted!</Alert>

                <p className="text-gray-600">
                  Reseting the application will remove all the endpoints,
                  subscriptions, webhook event logs, and API keys.
                </p>

                <div className="space-y-2">
                  <p className="text-gray-700">
                    Type <span className="font-bold">{app.name}</span> to
                    confirm.
                  </p>
                  <Input
                    value={confirm.tag === 'open' ? confirm.confirmation : ''}
                    onChange={(e) => onChange(e.target.value)}
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <Button onClick={closeModal}>Cancel</Button>
                  <Button
                    variant="danger"
                    disabled={
                      confirm.tag === 'open'
                        ? confirm.confirmation !== app.name
                        : true
                    }
                    onClick={onReset}
                  >
                    Confirm
                  </Button>
                </div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </div>
    </Dialog>
  </Transition>
);
