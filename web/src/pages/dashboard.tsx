import {Layout} from '@/components/layout/Layout';
import {Skeleton} from '@/components/Skeleton';

import {NextPageWithLayout} from './_app';

const Dashboard: NextPageWithLayout = () => (
  <Skeleton className="h-96 w-full rounded-lg" />
);

Dashboard.getLayout = (page) => (
  <Layout variant="dashboard" title="therssproject" seo={{}} goToAppOnLoad>
    {page}
  </Layout>
);

export default Dashboard;
