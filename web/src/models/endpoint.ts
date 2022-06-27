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

export type CreateEndpoint = {
  title: string;
  url: string;
};

export const createEndpoint = (app: string, body: CreateEndpoint) =>
  http.post(`/applications/${app}/endpoints`, body, Endpoint);

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noOp = () => {};

export const AppEndpointsAtom = atom(
  (get) =>
    pipe(
      get(SelectedAppAtom),
      O.chain((app) => R.lookup(app.id)(get(EndpointsAtom))),
      O.getOrElse((): LoadingEndpoints => RD.notAsked),
    ),
  (get, set, newEndpoints: LoadingEndpoints) =>
    pipe(
      get(SelectedAppAtom),
      O.match(noOp, (app) =>
        set(
          EndpointsAtom,
          pipe(get(EndpointsAtom), R.insertAt(app.id, newEndpoints)),
        ),
      ),
    ),
);

export const useSetNewEndpoint = () =>
  useAtomCallback(
    useCallback(
      (get, set, newEndpoint: Endpoint) =>
        pipe(
          get(SelectedAppAtom),
          O.match(noOp, (app) =>
            set(
              EndpointsAtom,
              pipe(
                get(EndpointsAtom),
                R.modifyAt(app.id, RD.map(A.append(newEndpoint))),
                O.getOrElse(() => get(EndpointsAtom)),
              ),
            ),
          ),
        ),
      [],
    ),
  );
