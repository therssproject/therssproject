import {identity} from 'fp-ts/lib/function';
import {NextPage} from 'next';
import {AppProps} from 'next/app';
import dynamic from 'next/dynamic';
import {ReactElement, ReactNode} from 'react';
import {Toaster} from 'react-hot-toast';

import '@/styles/globals.css';

import {useTrackUser} from '@/lib/analytics';
import {useSessionGuard} from '@/lib/routing';

const CripsNoSSR = dynamic(() => import('@/components/Crisp'), {ssr: false});

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

  useSessionGuard();
  useTrackUser();

  return (
    <>
      <Toaster reverseOrder />
      {getLayout(<Component {...pageProps} />)}
      <CripsNoSSR />
    </>
  );
}

export default MyApp;
