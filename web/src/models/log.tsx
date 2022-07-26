import {pipe} from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import * as R from 'fp-ts/Record';
import * as t from 'io-ts';
import * as te from 'io-ts-extra';
import {atom} from 'jotai';
import * as RD from 'remote-data-ts';

import {noOp} from '@/lib/effect';
import * as http from '@/lib/fetch';

import {SelectedAppAtom} from './application';
import {withQuery} from '@/lib/qs';

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


type Pagination = {
  limit?: number;
  from?: string;
};

export const fetchLogs = (app: string, pagination?: Pagination) =>
  http.get(withQuery(`/applications/${app}/webhooks`, pagination), t.array(Log));

export const AppLogsAtom = atom(
  (get) =>
    pipe(
      get(SelectedAppAtom),
      O.chain((app) => R.lookup(app.id)(get(LogsAtom))),
      O.getOrElse((): LoadingLogs => RD.notAsked),
    ),
  (get, set, newLogs: LoadingLogs) =>
    pipe(
      get(SelectedAppAtom),
      O.match(noOp, (app) =>
        set(LogsAtom, pipe(get(LogsAtom), R.insertAt(app.id, newLogs))),
      ),
    ),
);
