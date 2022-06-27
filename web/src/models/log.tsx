import {pipe} from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import * as R from 'fp-ts/Record';
import * as t from 'io-ts';
import * as te from 'io-ts-extra';
import {atom} from 'jotai';
import * as RD from 'remote-data-ts';

import * as http from '@/lib/fetch';

export const Log = te.sparseType({
  id: t.string,
  application: t.string,
  subscription: t.string,
  feed: t.string,
  endpoint: t.string,
  status: t.union([t.literal('sent'), t.literal('failed')]),
  endpoint_url: t.string,
  feed_url: t.string,
  feed_title: te.optional(t.string),
  created_at: t.string,
  sent_at: t.string,
});

export interface Log extends t.TypeOf<typeof Log> {}

type LoadingLogs = RD.RemoteData<string, Log[]>;

export type LogsState = Record<string, LoadingLogs>;

export const LogsAtom = atom<LogsState>({});

export const fetchLogs = (app: string) =>
  http.get(`/applications/${app}/webhooks`, t.array(Log));

// TODO: app id
export const AppLogsAtom = atom(
  (get) =>
    pipe(
      get(LogsAtom),
      R.lookup('62b03b9d0995bd5115d1321c'),
      O.getOrElse((): LoadingLogs => RD.notAsked),
    ),
  (get, set, newLogs: LoadingLogs) =>
    set(
      LogsAtom,
      pipe(get(LogsAtom), R.insertAt('62b03b9d0995bd5115d1321c', newLogs)),
    ),
);