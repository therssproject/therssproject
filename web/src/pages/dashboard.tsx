import {pipe} from 'fp-ts/function';
import * as O from 'fp-ts/Option';

import {useAtom} from '@/lib/jotai';

import {Layout} from '@/components/layout/Layout';

import {SessionAtom} from '@/models/user';

const Dashboard = () => {
  const [session] = useAtom(SessionAtom);

  return (
    <Layout
      variant="dashboard"
      title="Components"
      seo={{
        templateTitle: 'Components',
        description: 'Pre-built components with awesome default',
      }}
    >
      <div className="space-y-4">
        <div className="h-96 rounded-lg border-4 border-dashed border-gray-200">
          <div className="p-4">
            {pipe(
              session,
              O.map((u) => ({...u, access_token: u.access_token.slice(0, 10)})),
              O.match(
                () => <div>Logged out ...</div>,
                (user) => (
                  <div>
                    <pre>{JSON.stringify(user, null, 2)}</pre>
                  </div>
                ),
              ),
            )}
          </div>
        </div>
        <div className="h-96 rounded-lg border-4 border-dashed border-gray-200">
          <div className="p-4">
            {pipe(
              session,
              O.map((u) => ({...u, access_token: u.access_token.slice(0, 10)})),
              O.match(
                () => <div>Logged out ...</div>,
                (user) => (
                  <div>
                    <pre>{JSON.stringify(user, null, 2)}</pre>
                  </div>
                ),
              ),
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
