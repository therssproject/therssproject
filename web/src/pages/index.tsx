import {pipe} from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import {useAtom} from 'jotai';

import {external} from '@/lib/href';
import {Route} from '@/lib/routes';

import {Rss} from '@/components/icons/Rss';
import {Layout} from '@/components/layout/Layout';
import {UnderlineLink} from '@/components/links/UnderlineLink';

import {SessionAtom} from '@/models/user';

import {NextPageWithLayout} from './_app';

const HomePage: NextPageWithLayout = () => {
  const [session] = useAtom(SessionAtom);

  return (
    <section className="bg-white">
      <div className="layout flex min-h-screen flex-col items-center justify-center text-center">
        <Rss className="mt-4 h-24 w-auto text-red-300" />
        <h1 className="mt-2 text-gray-500">RSS</h1>
        <div className="mt-4">
          <UnderlineLink href={Route.components}>Components</UnderlineLink>
          {' / '}
          {pipe(
            session,
            O.match(
              () => (
                <>
                  <UnderlineLink href={Route.login()}>Login</UnderlineLink>
                  {' / '}
                  <UnderlineLink href={Route.register()}>
                    Register
                  </UnderlineLink>
                </>
              ),
              () => (
                <UnderlineLink href={Route.dashboard}>Dashboard</UnderlineLink>
              ),
            ),
          )}
        </div>

        <footer className="absolute bottom-2 text-gray-700">
          © {new Date().getFullYear()} By{' '}
          <UnderlineLink href={external('https://gillchristian.xyz')}>
            gillchristian
          </UnderlineLink>
          {' & '}
          <UnderlineLink href={external('https://github.com/ndelvalle')}>
            ndelvalle
          </UnderlineLink>
        </footer>
      </div>
    </section>
  );
};

HomePage.getLayout = (page) => <Layout variant="clean">{page}</Layout>;

export default HomePage;
