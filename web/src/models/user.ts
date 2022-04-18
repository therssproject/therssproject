import * as t from 'io-ts';

export const PublicUser = t.interface({
  id: t.string,
  name: t.string,
  email: t.string,
  updated_at: t.string,
  created_at: t.string,
});

export interface PublicUser extends t.TypeOf<typeof PublicUser> {}

export const AuthResponse = t.interface({
  access_token: t.string,
  user: PublicUser,
});

export interface AuthResponse extends t.TypeOf<typeof AuthResponse> {}
