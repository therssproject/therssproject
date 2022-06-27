import * as t from 'io-ts';
import * as te from 'io-ts-extra';

export const Log = te.sparseType({
  id: t.string,
  application: t.string,
  subscription: t.string,
  feed: t.string,
  endpoint: t.string,
  status: t.string, // This is actually an enum (sent | failed)
  endpoint_url: t.string,
  feed_url: t.string,
  feed_title: te.optional(t.string),
  created_at: t.string,
  sent_at: t.string,
});

export interface Log extends t.TypeOf<typeof Log> {}
