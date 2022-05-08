import * as E from 'fp-ts/Either';
import {pipe, Lazy} from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import * as IOE from 'fp-ts/IOEither';
import * as IO from 'fp-ts/IO';
import * as O from 'fp-ts/Option';
import * as t from 'io-ts';
import reporter from 'io-ts-reporters';

import * as CONFIG from '@/config';
import {Session, SESSION_KEY} from '@/models/user';

export type FetchError =
  | {tag: 'unknown'; message: string}
  | {tag: 'fetch'; code: number; message: string}
  | {tag: 'encoding'; message: string}
  | {tag: 'decoding'; messages: string[]};

const unknown = (error: unknown): FetchError => ({
  tag: 'unknown',
  message:
    error instanceof Error
      ? error.message
      : typeof error === 'string'
      ? error
      : 'Failed to fetch',
});

const decoding = (messages: string[]): FetchError => ({
  tag: 'decoding',
  messages,
});

const encoding = (error: unknown): FetchError => ({
  tag: 'encoding',
  message:
    error instanceof Error
      ? error.message
      : typeof error === 'string'
      ? error
      : 'Failed to fetch',
});

const fetch_ = (code: number, message: string): FetchError => ({
  tag: 'fetch',
  code,
  message,
});

const handleResponse =
  <T>(codec: t.Decoder<unknown, T>) =>
  (res: Response): TE.TaskEither<FetchError, T> =>
    pipe(
      TE.tryCatch(() => res.json(), unknown),
      TE.map((body) => ({
        body,
        ok: res.ok,
        status: res.status,
        statusText: res.statusText,
      })),
      TE.filterOrElse(
        ({ok}) => ok,
        ({status, statusText}) => fetch_(status, statusText),
      ),
      TE.chain(({body}) =>
        pipe(
          codec.decode(body),
          E.mapLeft(E.left),
          E.mapLeft(reporter.report),
          E.mapLeft(decoding),
          TE.fromEither,
        ),
      ),
    );
const addBaseUrl = (url: string) =>
  url.startsWith('/') ? `${CONFIG.baseUrl}${url}` : url;

// TODO: use IOOption & TaskOption
const grabSession = pipe(
  IOE.tryCatch(
    () => JSON.parse(localStorage.getItem(SESSION_KEY) ?? ''),
    () => 'Failed to get session from localStorage',
  ),
  IOE.chainEitherK((json) =>
    pipe(
      json,
      Session.decode,
      E.mapLeft(() => 'Failed to decode setored session'),
    ),
  ),
  TE.fromIOEither,
  TE.orElse(() => TE.right<never, Session>(O.none)),
);

const AppJson = {
  'Content-Type': 'application/json',
};

const AuthToken = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

const mkHeaders = (session: Session, headers: RequestInit['headers']) => ({
  ...AppJson,
  ...pipe(
    session,
    O.match(
      () => undefined,
      ({access_token: token}) => AuthToken(token),
    ),
  ),
  ...headers,
});

const req =
  (method: 'GET' | 'DELETE') =>
  <T>(
    url: string,
    codec: t.Decoder<unknown, T>,
    opts?: RequestInit,
  ): TE.TaskEither<FetchError, T> =>
    pipe(
      grabSession,
      TE.chain((session) =>
        TE.tryCatch(
          () =>
            fetch(addBaseUrl(url), {
              ...opts,
              method,
              headers: mkHeaders(session, opts?.headers),
            }),
          unknown,
        ),
      ),
      TE.chain(handleResponse(codec)),
    );

const reqWithBody =
  (method: 'POST' | 'PUT' | 'PATCH') =>
  <T>(
    url: string,
    body: unknown,
    codec: t.Decoder<unknown, T>,
    opts?: RequestInit,
  ): TE.TaskEither<FetchError, T> =>
    pipe(
      grabSession,
      TE.chain((session) =>
        pipe(
          TE.tryCatch(() => Promise.resolve(JSON.stringify(body)), encoding),
          TE.map((encodedBody) => ({session, encodedBody})),
        ),
      ),
      TE.chain(({encodedBody, session}) =>
        TE.tryCatch(
          () =>
            fetch(addBaseUrl(url), {
              ...opts,
              method,
              body: encodedBody,
              headers: mkHeaders(session, opts?.headers),
            }),
          unknown,
        ),
      ),
      TE.chain(handleResponse(codec)),
    );

export const get = req('GET');
export const del = req('DELETE');
export const post = reqWithBody('POST');
export const put = reqWithBody('PUT');
export const patch = reqWithBody('PATCH');
