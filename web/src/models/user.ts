import * as O from 'fp-ts/Option';
import * as t from 'io-ts';
import * as tt from 'io-ts-types';
import {useSetAtom} from 'jotai';
import {atomWithStorage} from 'jotai/utils';
import * as RD from 'remote-data-ts';

import * as crisp from '@/lib/crisp';
import * as http from '@/lib/fetch';
import {useAtom} from '@/lib/jotai';
import * as analytics from '@/lib/analytics';

import {AppsAtom, SelectedAppAtom} from './application';
import {EndpointsAtom} from './endpoint';
import {LogsAtom} from './log';
import {SubscriptionsAtom} from './subscription';

export const PublicUser = t.interface({
  id: t.string,
  name: t.string,
  email: t.string,
  updated_at: t.string,
  created_at: t.string,
});

export interface PublicUser extends t.TypeOf<typeof PublicUser> {}

export const AuthResponse = t.interface({
  access_token: t.string,
  user: PublicUser,
});

export interface AuthResponse extends t.TypeOf<typeof AuthResponse> {}

export type Session = O.Option<AuthResponse>;

export const Session = tt.option(AuthResponse);

export const SESSION_KEY = '__user_session';

const SessionAtom = atomWithStorage<Session>(SESSION_KEY, O.none);

export const authenticate = (payload: {email: string; password: string}) =>
  http.post('/users/authenticate', payload, AuthResponse);

export const register = (payload: {
  name: string;
  email: string;
  password: string;
}) => http.post<PublicUser>('/users', payload, PublicUser);

export const useSession = () => {
  const [session, setSession] = useAtom(SessionAtom);
  const setApps = useSetAtom(AppsAtom);
  const setSelectdApp = useSetAtom(SelectedAppAtom);
  const setSubscriptions = useSetAtom(SubscriptionsAtom);
  const setLogs = useSetAtom(LogsAtom);
  const setEndpoints = useSetAtom(EndpointsAtom);

  const logOut = () => {
    setSession(O.none);
    setSelectdApp(O.none);
    setApps(RD.notAsked);
    setSubscriptions({});
    setLogs({});
    setEndpoints({});

    crisp.clearEmail();
    analytics.identify('*');
  };

  const login = (session: AuthResponse) => {
    setSession(O.some(session));
    crisp.setEmail(session.user.email);

    analytics.identify(session.user.id, {
      name: session.user.name,
      email: session.user.email,
    });
  };

  return {session, login, logOut};
};
