import {Layout} from '@/components/layout/Layout';
import {Skeleton} from '@/components/Skeleton';

import {NextPageWithLayout} from './_app';

const Dashboard: NextPageWithLayout = () => (
  <Skeleton className="h-96 w-full rounded-lg" />
);

Dashboard.getLayout = (page) => (
  <Layout
    variant="dashboard"
    title="RSS"
    goToAppOnLoad
    seo={{
      templateTitle: 'RSS',
      description: 'Pre-built components with awesome default',
    }}
  >
    {page}
  </Layout>
);

export default Dashboard;
