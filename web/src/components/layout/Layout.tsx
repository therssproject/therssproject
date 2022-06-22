import {ReactNode} from 'react';
import {match} from 'ts-pattern';

import {useSessionGuard} from '@/lib/routing';

import {Props as SeoProps, Seo} from '@/components/Seo';

import {Applications} from './Applications';
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
      goToAppOnLoad: boolean;
      seo?: SeoProps;
    }
  | {
      variant: 'applications';
      title: string;
      children: ReactNode;
      seo?: SeoProps;
    };

export const Layout = (props: Props) => {
  useSessionGuard();

  return match(props)
    .with({variant: 'dashboard'}, (props) => <Dashboard {...props} />)
    .with({variant: 'applications'}, (props) => <Applications {...props} />)
    .with({variant: 'clean'}, (props) => (
      <>
        <Seo {...props.seo} />
        <main className="h-full">{props.children}</main>
      </>
    ))
    .exhaustive();
};
