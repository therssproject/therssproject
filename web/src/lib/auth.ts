import {getTupleEq} from 'fp-ts/Eq';
import {contramap, Eq} from 'fp-ts/Eq';
import {pipe} from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import {Eq as eqString} from 'fp-ts/string';
import {useStableEffect} from 'fp-ts-react-stable-hooks';
import {useAtom} from 'jotai';
import {useRouter} from 'next/router';

import {AuthResponse, SessionAtom} from '@/models/user';

export const eqAuthResponse: Eq<AuthResponse> = pipe(
  eqString,
  contramap(({access_token}: AuthResponse) => access_token),
);

export const useOnlyLoggedOut = () => {
  const router = useRouter();
  const [session] = useAtom(SessionAtom);

  // TODO: remember where the user came from and redirect there
  useStableEffect(
    () => {
      if (O.isSome(session)) {
        router.push('/dashboard');
      }
    },
    [session],
    getTupleEq(O.getEq(eqAuthResponse)),
  );
};

export const useOnlyLoggedIn = () => {
  const router = useRouter();
  const [session] = useAtom(SessionAtom);

  // TODO: remember where the user came from and redirect there
  useStableEffect(
    () => {
      if (O.isNone(session)) {
        router.push('/login');
      }
    },
    [session],
    getTupleEq(O.getEq(eqAuthResponse)),
  );
};
