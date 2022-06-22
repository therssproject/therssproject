import {NextPage} from 'next';
import {AppProps} from 'next/app';
import {ReactElement, ReactNode} from 'react';

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
  return Component.getLayout(<Component {...pageProps} />);
}

export default MyApp;
