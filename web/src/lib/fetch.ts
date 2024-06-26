import * as E from 'fp-ts/Either';
import {pipe, Predicate} from 'fp-ts/function';
import * as IOE from 'fp-ts/IOEither';
import * as O from 'fp-ts/Option';
import * as TE from 'fp-ts/TaskEither';
import * as t from 'io-ts';
import reporter from 'io-ts-reporters';

import * as CONFIG from '@/config';
import {Session, SESSION_KEY} from '@/models/user';

export type FetchError =
  | {tag: 'unknown'; message: string}
  | {tag: 'fetch'; code: number; message: string}
  | {tag: 'encoding'; message: string}
  | {tag: 'decoding'; messages: string[]};

const FetchError = {
  unknown: (error: unknown): FetchError => ({
    tag: 'unknown',
    message:
      error instanceof Error
        ? error.message
        : typeof error === 'string'
        ? error
        : 'Failed to fetch',
  }),
  decoding: (messages: string[]): FetchError => ({
    tag: 'decoding',
    messages,
  }),
  encoding: (error: unknown): FetchError => ({
    tag: 'encoding',
    message:
      error instanceof Error
        ? error.message
        : typeof error === 'string'
        ? error
        : 'Failed to fetch',
  }),
  fetch: (code: number, message: string): FetchError => ({
    tag: 'fetch',
    code,
    message,
  }),
};

export const isOfStatus =
  (status: number | Predicate<number>) => (error: FetchError) =>
    error.tag === 'fetch' &&
    (typeof status === 'function' ? status(error.code) : error.code === status);

export const is4xx = isOfStatus((code) => code >= 400 && code < 500);

export const is5xx = isOfStatus((code) => code >= 500);

export type Res<T> = {headers: Headers; data: T; status: number};

const handleResponseWithBody =
  <T>(codec: t.Decoder<unknown, T>) =>
  (res: Response): TE.TaskEither<FetchError, Res<T>> =>
    pipe(
      res,
      TE.fromPredicate(
        () => res.ok,
        () => FetchError.fetch(res.status, res.statusText),
      ),
      TE.chain(() => TE.tryCatch(() => res.json(), FetchError.unknown)),
      TE.chain((body) =>
        pipe(
          codec.decode(body),
          E.mapLeft(E.left),
          E.mapLeft(reporter.report),
          E.mapLeft(FetchError.decoding),
          E.map((data) => ({data, headers: res.headers, status: res.status})),
          TE.fromEither,
        ),
      ),
    );

const handleResponse = (res: Response): TE.TaskEither<FetchError, Res<void>> =>
  pipe(
    res,
    TE.fromPredicate(
      () => res.ok,
      () => FetchError.fetch(res.status, res.statusText),
    ),
    TE.map(() => ({data: undefined, headers: res.headers, status: res.status})),
  );

const addBaseUrl = (url: string) =>
  url.startsWith('/') ? `${CONFIG.API_URL}${url}` : url;

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

const mkReq_ = (
  method: 'GET' | 'DELETE',
  url: string,
  opts?: RequestInit,
): TE.TaskEither<FetchError, Response> =>
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
        FetchError.unknown,
      ),
    ),
  );

const req =
  (method: 'GET' | 'DELETE') =>
  <T>(
    url: string,
    codec: t.Decoder<unknown, T>,
    opts?: RequestInit,
  ): TE.TaskEither<FetchError, Res<T>> =>
    pipe(mkReq_(method, url, opts), TE.chain(handleResponseWithBody(codec)));

const req_ =
  (method: 'GET' | 'DELETE') =>
  (url: string, opts?: RequestInit): TE.TaskEither<FetchError, Res<void>> =>
    pipe(mkReq_(method, url, opts), TE.chain(handleResponse));

const mkReq = (
  method: 'POST' | 'PUT' | 'PATCH',
  url: string,
  body: unknown,
  opts?: RequestInit,
): TE.TaskEither<FetchError, Response> =>
  pipe(
    grabSession,
    TE.chain((session) =>
      pipe(
        TE.tryCatch(
          () => Promise.resolve(JSON.stringify(body)),
          FetchError.encoding,
        ),
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
        FetchError.unknown,
      ),
    ),
  );

const reqWithBody =
  (method: 'POST' | 'PUT' | 'PATCH') =>
  <T>(
    url: string,
    body: unknown,
    codec: t.Decoder<unknown, T>,
    opts?: RequestInit,
  ): TE.TaskEither<FetchError, Res<T>> =>
    pipe(
      mkReq(method, url, body, opts),
      TE.chain(handleResponseWithBody(codec)),
    );

const reqWithBody_ =
  (method: 'POST' | 'PUT' | 'PATCH') =>
  (
    url: string,
    body: unknown,
    opts?: RequestInit,
  ): TE.TaskEither<FetchError, Res<void>> =>
    pipe(mkReq(method, url, body, opts), TE.chain(handleResponse));

export const get = req('GET');
export const get_ = req_('GET');

export const del = req('DELETE');
export const del_ = req_('DELETE');

export const post = reqWithBody('POST');
export const post_ = reqWithBody_('POST');

export const put = reqWithBody('PUT');
export const put_ = reqWithBody_('PUT');

export const patch = reqWithBody('PATCH');
export const patch_ = reqWithBody_('PATCH');
