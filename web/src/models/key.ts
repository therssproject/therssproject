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

import {noOp} from '@/lib/effect';
import * as http from '@/lib/fetch';

import {SelectedAppAtom} from './application';

export const Key = te.sparseType({
  id: t.string,
  application: t.string,
  title: t.string,
  created_at: t.string,
});

export interface Key extends t.TypeOf<typeof Key> {}

type LoadingKeys = RD.RemoteData<string, Key[]>;

export type KeysState = Record<string, LoadingKeys>;

export const KeysAtom = atom<KeysState>({});

export const fetchKeys = (app: string) =>
  http.get(`/applications/${app}/keys`, t.array(Key));

export const GeneratedKey = te.sparseType({
  id: t.string,
  key: t.string,
  application: t.string,
  title: t.string,
  created_at: t.string,
});

export interface GeneratedKey extends t.TypeOf<typeof GeneratedKey> {}

export type GenerateKey = {title: string};

export const generateKey = (app: string, body: GenerateKey) =>
  http.post(`/applications/${app}/keys`, body, GeneratedKey);

export const deleteKey = (app: string, key: string) =>
  http.del(`/applications/${app}/keys/${key}`, t.void);

export const AppKeysAtom = atom(
  (get) =>
    pipe(
      get(SelectedAppAtom),
      O.chain((app) => R.lookup(app.id)(get(KeysAtom))),
      O.getOrElse((): LoadingKeys => RD.notAsked),
    ),
  (get, set, newKeys: LoadingKeys) =>
    pipe(
      get(SelectedAppAtom),
      O.match(noOp, (app) =>
        set(KeysAtom, pipe(get(KeysAtom), R.insertAt(app.id, newKeys))),
      ),
    ),
);

export const useSetNewKey = () =>
  useAtomCallback(
    useCallback(
      (get, set, newEndpoint: Key) =>
        pipe(
          get(SelectedAppAtom),
          O.match(noOp, (app) =>
            set(
              KeysAtom,
              pipe(
                get(KeysAtom),
                R.modifyAt(app.id, RD.map(A.append(newEndpoint))),
                O.getOrElse(() => get(KeysAtom)),
              ),
            ),
          ),
        ),
      [],
    ),
  );
