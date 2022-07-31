import * as Eq from 'fp-ts/Eq';
import {pipe} from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import {Eq as eqString} from 'fp-ts/string';
import {useStableEffect} from 'fp-ts-react-stable-hooks';
import * as t from 'io-ts';
import * as tt from 'io-ts-types';
import {useSetAtom} from 'jotai';
import {atomWithStorage} from 'jotai/utils';
import * as RD from 'remote-data-ts';

import * as analytics from '@/lib/analytics';
import * as crisp from '@/lib/crisp';
import * as http from '@/lib/fetch';
import {useAtom} from '@/lib/jotai';

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

const eqSession = pipe(
  eqString,
  Eq.contramap((s: AuthResponse) => s.user.id),
  O.getEq,
);

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
    // TODO: move to `useTrackUser` when dependency on CripsNoSSR is fiexed
    crisp.clearEmail();
  };

  const login = (session: AuthResponse) => {
    setSession(O.some(session));
    // TODO: move to `useTrackUser` when dependency on CripsNoSSR is fiexed
    crisp.setEmail(session.user.email);
  };

  return {session, login, logOut};
};

export const useTrackUser = () => {
  const {session} = useSession();

  useStableEffect(
    () =>
      pipe(
        session,
        O.match(
          () => {
            analytics.identify('*');
          },
          ({user}) => {
            analytics.identify(user.id, {
              name: user.name,
              email: user.email,
            });
          },
        ),
      ),
    [session],
    Eq.tuple(eqSession),
  );
};
