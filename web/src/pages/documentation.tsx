import {Layout} from '@/components/layout/Layout';

import {NextPageWithLayout} from './_app';

const Documentation: NextPageWithLayout = () => {
  return (
    <div className="h-96 rounded-lg border-4 border-dashed border-gray-200">
      <div className="p-4">
        <p>Coming soon!</p>
      </div>
    </div>
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
