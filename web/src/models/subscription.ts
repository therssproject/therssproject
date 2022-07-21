import * as A from 'fp-ts/Array';
import {pipe} from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import * as R from 'fp-ts/Record';
import * as t from 'io-ts';
import * as te from 'io-ts-extra';
import {atom} from 'jotai';
import {useAtomCallback} from 'jotai/utils';
import {useCallback} from 'react';
import * as RD from 'remote-data-ts';

import * as http from '@/lib/fetch';

import {SelectedAppAtom} from './application';

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

export const fetchSubscriptions = (app: string, opts = {limit: 100}) =>
  http.get(
    `/applications/${app}/subscriptions?limit=${opts.limit}`,
    t.array(Subscription),
  );

export type CreateSubscription = {
  url: string;
  endpoint: string;
};

export const createSubscription = (app: string, body: CreateSubscription) =>
  http.post(`/applications/${app}/subscriptions`, body, Subscription);

export const deleteSubscription = (app: string, subscription: string) =>
  http.del(`/applications/${app}/subscriptions/${subscription}`, t.void);

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noOp = () => {};

export const AppSubscriptionsAtom = atom(
  (get) =>
    pipe(
      get(SelectedAppAtom),
      O.chain((app) => R.lookup(app.id)(get(SubscriptionsAtom))),
      O.getOrElse((): LoadingSubscriptions => RD.notAsked),
    ),
  (get, set, newSubscriptions: LoadingSubscriptions) =>
    pipe(
      get(SelectedAppAtom),
      O.match(noOp, (app) =>
        set(
          SubscriptionsAtom,
          pipe(get(SubscriptionsAtom), R.insertAt(app.id, newSubscriptions)),
        ),
      ),
    ),
);

export const useSetNewSubscription = () =>
  useAtomCallback(
    useCallback(
      (get, set, newSub: Subscription) =>
        pipe(
          get(SelectedAppAtom),
          O.match(noOp, (app) =>
            set(
              SubscriptionsAtom,
              pipe(
                get(SubscriptionsAtom),
                R.modifyAt(app.id, RD.map(A.append(newSub))),
                O.getOrElse(() => get(SubscriptionsAtom)),
              ),
            ),
          ),
        ),
      [],
    ),
  );
