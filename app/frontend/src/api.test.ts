import { login, getProfile } from './api';
import {server} from "./mocks/server";
// @ts-ignore
import {rest} from "msw";

describe('api.ts wrapper', () => {
  it('login() should store token', async () => {
    await login('user', 'pass');
    expect(localStorage.getItem('token')).toBe('fake-token');
  });

  it('getProfile() returns user when token is valid', async () => {
    localStorage.setItem('token', 'fake-token');
    // @ts-ignore
    const profile = await getProfile();
    expect(profile).toEqual({ username: 'bob', email: 'bob@example.com' });
  });

  it('getProfile() clears token and throws on 401', async () => {
    localStorage.setItem('token', 'bad-token');
    // override MSW to force 401
    server.use(
      rest.get('http://localhost:8001/users/me', (req, res, ctx) => res(ctx.status(401)))
    );
    // @ts-ignore
    await expect(getProfile()).rejects.toThrow('Unauthorized');
    expect(localStorage.getItem('token')).toBeNull();
  });
});