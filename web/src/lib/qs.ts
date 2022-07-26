import {pipe} from 'fp-ts/function';
import * as R from 'fp-ts/Record';
import {Ord as ordString} from 'fp-ts/string';

type QueryKey = string
type QueryVal = number | string | boolean | undefined;

type Query = Record<QueryKey, QueryVal>;

const queryValToString = (val: string | number | boolean | undefined) =>
  typeof val === 'string'
    ? val
    : typeof val === 'number'
    ? `${val}`
    : val === true
    ? 'true'
    : val === false
    ? 'false'
    : '';

export const encode = <Q extends Query>(q: Q): string =>
  pipe(
    q,
    R.reduceWithIndex(ordString)('', (key, acc, val) =>
      acc === ''
        ? `?${key}=${queryValToString(val)}`
        : `${acc}&${key}=${queryValToString(val)}`,
    ),
  );

export const withQuery = <Q extends Query>(url: string, q?: Q) =>
  q ? `${url}${encode(q)}` : url;
