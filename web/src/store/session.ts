import * as O from 'fp-ts/Option';
import {atomWithStorage} from 'jotai/utils';

import {AuthResponse} from '@/models/user';

export type Session = O.Option<AuthResponse>;

export const SessionAtom = atomWithStorage<Session>('__user_session', O.none);
