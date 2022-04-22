import {getTupleEq} from 'fp-ts/Eq';
import * as O from 'fp-ts/Option';
import {useStableEffect} from 'fp-ts-react-stable-hooks';
import {useAtom} from 'jotai';
import {useRouter} from 'next/router';

import {SessionAtom} from '@/store/session';

import {eqAuthResponse} from '@/models/user';

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
