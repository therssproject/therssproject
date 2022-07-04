import {BeakerIcon} from '@heroicons/react/outline';

import {Alert} from '@/components/Alert';
import {Layout} from '@/components/layout/Layout';

import {NextPageWithLayout} from './_app';

const Documentation: NextPageWithLayout = () => {
  return (
    <Alert variant="warning">
      <div className="flex">
        <BeakerIcon className="mr-2 h-8 w-8" />
        <div className="text-lg">Coming soon ...</div>
      </div>
    </Alert>
  );
};

Documentation.getLayout = (page) => (
  <Layout
    variant="dashboard"
    title="Documentation"
    goToAppOnLoad={false}
    seo={{
      templateTitle: 'Documentation',
      description: 'RSS docs',
    }}
  >
    {page}
  </Layout>
);

export default Documentation;
