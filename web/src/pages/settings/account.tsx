import {BeakerIcon} from '@heroicons/react/24/outline';

import {Alert} from '@/components/Alert';
import {Layout} from '@/components/layout/Layout';

import {NextPageWithLayout} from '../_app';

const SettingsAccount: NextPageWithLayout = () => (
  <div>
    <Alert variant="warning">
      <div className="flex">
        <BeakerIcon className="mr-2 h-8 w-8" />
        <div className="text-lg">Coming soon ...</div>
      </div>
    </Alert>
  </div>
);

SettingsAccount.getLayout = (page) => (
  <Layout variant="dashboard" title="Account Settings" seo={{}} goToAppOnLoad>
    {page}
  </Layout>
);

export default SettingsAccount;
