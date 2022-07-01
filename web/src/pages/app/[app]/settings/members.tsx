import {pipe} from 'fp-ts/function';
import * as O from 'fp-ts/Option';

import {useAtom} from '@/lib/jotai';

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
        <div className="space-y-4">
          <Tabs app={app.id} />
          <div className="rounded-lg bg-red-50 p-4">Coming sonn ...</div>
        </div>
      ),
    ),
  );
};

// TODO: move the `useCurrentApp()` logic to the layout to be able to show the title?
AppSettingsKeys.getLayout = (page) => (
  <Layout
    variant="applications"
    title="Settings"
    seo={{
      templateTitle: 'Components',
      description: 'Pre-built components with awesome default',
    }}
  >
    {page}
  </Layout>
);

export default AppSettingsKeys;
