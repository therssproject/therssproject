import {BeakerIcon} from '@heroicons/react/24/outline';
import {pipe} from 'fp-ts/function';
import * as O from 'fp-ts/Option';

import {useAtom} from '@/lib/jotai';

import {Alert} from '@/components/Alert';
import {Layout} from '@/components/layout/Layout';
import {Tabs} from '@/components/SettingsTabs';

import {SelectedAppAtom} from '@/models/application';
import {NextPageWithLayout} from '@/pages/_app';

const AppSettingsKeys: NextPageWithLayout = () => {
  const [currentApp, _setCurrentApp] = useAtom(SelectedAppAtom);

  return pipe(
    currentApp,
    O.match(
      () => null,
      (app) => (
        <div className="space-y-8">
          <Tabs app={app.id} />
          <Alert variant="warning">
            <div className="flex">
              <BeakerIcon className="mr-2 h-8 w-8" />
              <div className="text-lg">Coming soon ...</div>
            </div>
          </Alert>
        </div>
      ),
    ),
  );
};

AppSettingsKeys.getLayout = (page) => (
  <Layout variant="applications" title="Settings" seo={{}}>
    {page}
  </Layout>
);

export default AppSettingsKeys;
