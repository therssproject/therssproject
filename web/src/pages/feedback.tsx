import {BeakerIcon} from '@heroicons/react/outline';

import {Alert} from '@/components/Alert';
import {Layout} from '@/components/layout/Layout';

import {NextPageWithLayout} from './_app';

const Feedback: NextPageWithLayout = () => {
  return (
    <Alert variant="warning">
      <div className="flex">
        <BeakerIcon className="mr-2 h-8 w-8" />
        <div className="text-lg">Coming soon ...</div>
      </div>
    </Alert>
  );
};

Feedback.getLayout = (page) => (
  <Layout
    variant="dashboard"
    title="Feedback"
    goToAppOnLoad={false}
    seo={{
      templateTitle: 'Feedback',
      description: 'RSS docs',
    }}
  >
    {page}
  </Layout>
);

export default Feedback;
