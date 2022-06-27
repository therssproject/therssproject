import {pipe} from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import * as R from 'fp-ts/Record';
import * as t from 'io-ts';
import * as te from 'io-ts-extra';
import {atom} from 'jotai';
import * as RD from 'remote-data-ts';

import * as http from '@/lib/fetch';

export const Endpoint = te.sparseType({
  id: t.string,
  application: t.string,
  url: t.string,
  title: t.string,
  created_at: t.string,
  updated_at: t.string,
});

export interface Endpoint extends t.TypeOf<typeof Endpoint> {}

type LoadingEndpoints = RD.RemoteData<string, Endpoint[]>;

export type EndpointsState = Record<string, LoadingEndpoints>;

export const EndpointsAtom = atom<EndpointsState>({});

export const fetchEndpoints = (app: string) =>
  http.get(`/applications/${app}/endpoints`, t.array(Endpoint));

export const AppEndpointsAtom = atom(
  (get) =>
    pipe(
      get(EndpointsAtom),
      R.lookup('62b03b9d0995bd5115d1321c'),
      O.getOrElse((): LoadingEndpoints => RD.notAsked),
    ),
  (get, set, newEndpoints: LoadingEndpoints) =>
    set(
      EndpointsAtom,
      pipe(
        get(EndpointsAtom),
        R.insertAt('62b03b9d0995bd5115d1321c', newEndpoints),
      ),
    ),
);
