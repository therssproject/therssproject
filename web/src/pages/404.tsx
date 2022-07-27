import * as React from 'react';
import {RiAlarmWarningFill} from 'react-icons/ri';

import {Route} from '@/lib/routes';

import {Layout} from '@/components/layout/Layout';
import {ArrowLink} from '@/components/links/ArrowLink';
import {Logo} from '@/components/Logo';

import {NextPageWithLayout} from './_app';

const NotFoundPage: NextPageWithLayout = () => {
  return (
    <section className="bg-white">
      <div className="layout flex min-h-screen flex-col items-center justify-center text-center text-black">
        <RiAlarmWarningFill
          size={60}
          className="drop-shadow-glow animate-flicker text-red-500"
        />
        <div className="mt-8">
          <Logo />
        </div>
        <h1 className="mt-8 text-4xl text-gray-700 md:text-6xl">
          Page Not Found
        </h1>
        <ArrowLink className="mt-4 text-gray-700 md:text-lg" href={Route.index}>
          Back to Home
        </ArrowLink>
      </div>
    </section>
  );
};

NotFoundPage.getLayout = (page) => (
  <Layout variant="clean" seo={{templateTitle: 'Not Found'}}>
    {page}
  </Layout>
);

export default NotFoundPage;
