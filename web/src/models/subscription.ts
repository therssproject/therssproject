import {pipe} from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import * as R from 'fp-ts/Record';
import * as t from 'io-ts';
import * as te from 'io-ts-extra';
import {atom} from 'jotai';
import * as RD from 'remote-data-ts';

import * as http from '@/lib/fetch';

export const Subscription = te.sparseType({
  id: t.string,
  application: t.string,
  url: t.string,
  feed: t.string,
  endpoint: t.string,
  // TODO: add codec for Json type
  // metadata: Json,
  created_at: t.string,
});

export interface Subscription extends t.TypeOf<typeof Subscription> {}

type LoadingSubscriptions = RD.RemoteData<string, Subscription[]>;

export type SubscriptionsState = Record<string, LoadingSubscriptions>;

export const SubscriptionsAtom = atom<SubscriptionsState>({});

export const fetchSubscriptions = (app: string) =>
  http.get(`/applications/${app}/subscriptions`, t.array(Subscription));

export const AppSubscriptionsAtom = atom(
  (get) =>
    pipe(
      get(SubscriptionsAtom),
      R.lookup('62b03b9d0995bd5115d1321c'),
      O.getOrElse((): LoadingSubscriptions => RD.notAsked),
    ),
  (get, set, newSubscriptions: LoadingSubscriptions) =>
    set(
      SubscriptionsAtom,
      pipe(
        get(SubscriptionsAtom),
        R.insertAt('62b03b9d0995bd5115d1321c', newSubscriptions),
      ),
    ),
);
