import mixpanelPlugin from '@analytics/mixpanel';
import Analytics from 'analytics';
import * as Eq from 'fp-ts/Eq';
import {pipe} from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import {Eq as eqString} from 'fp-ts/string';
import {useStableEffect} from 'fp-ts-react-stable-hooks';
import {atom} from 'jotai';

import {useAtom} from '@/lib/jotai';

import {MixPanelToken} from '@/config';
import {AuthResponse, useSession} from '@/models/user';

const analytics = Analytics({
  app: 'therssproject',
  plugins: [
    mixpanelPlugin({
      token: MixPanelToken,
      pageEvent: 'visit_page',
      // TODO: setup custom script
      // customScriptSrc:
    }),
  ],
});

export const pageView = () => analytics.page();

type Json = null | number | string | Array<Json> | {[key: string]: Json};

type Payload = {[key: string]: Json};

export const event = (event: string, payload?: Payload) =>
  analytics.track(event, payload);

export const identify = (id: string, payload?: Payload) =>
  analytics.identify(id, payload);

export const reset = () => analytics.reset();

const eqSession = pipe(
  eqString,
  Eq.contramap((s: AuthResponse) => s.user.id),
  O.getEq,
);

type AnalyticsEvent = 'none' | 'reset' | 'identify';

const LastEventAton = atom<AnalyticsEvent>('none');

export const useTrackUser = () => {
  const {session} = useSession();
  const [lastEvent, setEvent] = useAtom(LastEventAton);

  useStableEffect(
    () =>
      pipe(
        session,
        O.match(
          () => {
            if (lastEvent !== 'reset') {
              analytics.reset();
              setEvent('reset');
            }
          },
          ({user}) => {
            analytics.identify(user.id, {
              name: user.name,
              email: user.email,
            });
            setEvent('identify');
          },
        ),
      ),
    [session],
    Eq.tuple(eqSession),
  );
};
