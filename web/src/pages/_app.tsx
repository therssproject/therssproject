import { AppProps } from 'next/app';

import '@/styles/globals.css';
// TODO remove after picking colors
import '@/styles/colors.css';

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default MyApp;
