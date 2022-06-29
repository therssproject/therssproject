import {identity} from 'fp-ts/lib/function';
import {NextPage} from 'next';
import {AppProps} from 'next/app';
import {ReactElement, ReactNode} from 'react';
import {Toaster} from 'react-hot-toast';

import '@/styles/globals.css';
// TODO remove after picking colors
import '@/styles/colors.css';

export type NextPageWithLayout = NextPage & {
  getLayout: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

function MyApp({Component, pageProps}: AppPropsWithLayout) {
  // Although all pages should have `getLayout`, Next also renders other pages
  // (like the 500 one) which do not have it.
  const getLayout = Component.getLayout ?? identity;

  return (
    <>
      <Toaster reverseOrder />
      {getLayout(<Component {...pageProps} />)}
    </>
  );
}

export default MyApp;
