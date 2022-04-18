import * as E from 'fp-ts/Either';
import {pipe} from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import * as t from 'io-ts';
import reporter from 'io-ts-reporters';

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

const req =
  (method: 'GET' | 'DELETE') =>
  <T>(
    url: string,
    codec: t.Decoder<unknown, T>,
    opts?: RequestInit,
  ): TE.TaskEither<FetchError, T> =>
    pipe(
      TE.tryCatch(() => fetch(url, {...opts, method}), unknown),
      TE.chain(handleResponse(codec)),
    );

export const get = req('GET');
export const del = req('DELETE');

const reqWithBody =
  (method: 'POST' | 'PUT' | 'PATCH') =>
  <T>(
    url: string,
    body: unknown,
    codec: t.Decoder<unknown, T>,
    opts?: RequestInit,
  ): TE.TaskEither<FetchError, T> =>
    pipe(
      TE.tryCatch(() => Promise.resolve(JSON.stringify(body)), encoding),
      TE.chain((encodedBody) =>
        TE.tryCatch(
          () =>
            fetch(url, {
              ...opts,
              method,
              body: encodedBody,
              headers: {...opts?.headers, 'Content-Type': 'application/json'},
            }),
          unknown,
        ),
      ),
      TE.chain(handleResponse(codec)),
    );

export const post = reqWithBody('POST');
export const put = reqWithBody('PUT');
export const patch = reqWithBody('PATCH');
