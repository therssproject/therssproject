import {Layout} from '@/components/layout/Layout';

const Documentation = () => {
  return (
    <Layout
      variant="dashboard"
      title="Documentation"
      seo={{
        templateTitle: 'Documentation',
        description: 'RSS docs',
      }}
    >
      <div className="h-96 rounded-lg border-4 border-dashed border-gray-200">
        <div className="p-4">
          <p>Coming soon!</p>
        </div>
      </div>
    </Layout>
  );
};

export default Documentation;
