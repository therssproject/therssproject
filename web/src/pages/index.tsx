import * as React from 'react';

import {Rss} from '@/components/icons/Rss';
import Layout from '@/components/layout/Layout';
import UnderlineLink from '@/components/links/UnderlineLink';
import Seo from '@/components/Seo';

export default function HomePage() {
  return (
    <Layout>
      <Seo />

      <main>
        <section className="bg-white">
          <div className="layout flex min-h-screen flex-col items-center justify-center text-center">
            <Rss className="text-red-300 h-24 w-auto mt-4" />
            <h1 className="mt-2 text-gray-500">RSS</h1>

            <footer className="absolute bottom-2 text-gray-700">
              © {new Date().getFullYear()} By{' '}
              <UnderlineLink href="https://gillchristian.xyz">
                gillchristian
              </UnderlineLink>
              {' & '}
              <UnderlineLink href="https://github.com/ndelvalle">
                ndelvalle
              </UnderlineLink>
            </footer>
          </div>
        </section>
      </main>
    </Layout>
  );
}
