import {ReactNode} from 'react';
import {match} from 'ts-pattern';

import {useSessionGuard} from '@/lib/routing';

import {Props as SeoProps, Seo} from '@/components/Seo';

import {Dashboard} from './Dashboard';

type Props =
  | {
      variant: 'clean';
      children: ReactNode;
      seo?: SeoProps;
    }
  | {
      variant: 'dashboard';
      title: string;
      children: ReactNode;
      seo?: SeoProps;
    };

export const Layout = (props: Props) => {
  useSessionGuard();

  return match(props)
    .with({variant: 'dashboard'}, (props) => (
      <Dashboard
        title={props.title}
        seo={props.seo}
        children={props.children}
      />
    ))
    .with({variant: 'clean'}, (props) => (
      <>
        <Seo {...props.seo} />
        <main>{props.children}</main>
      </>
    ))
    .exhaustive();
};
