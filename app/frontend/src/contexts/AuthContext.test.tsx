// @ts-ignore
import React, { useContext } from 'react';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, AuthContext } from './AuthContext';
import userEvent from '@testing-library/user-event';
import { server } from '../mocks/server';
// @ts-ignore
import { rest } from 'msw';

const TestConsumer = () => {
  const { user, login, logout } = useContext(AuthContext);
  return (
      <div>
        <div data-testid="username">{user?.username || 'no-user'}</div>
        <button onClick={() => login('x','y')}>Login</button>
        <button onClick={logout}>Logout</button>
      </div>
  );
};

describe('AuthContext', () => {
  it('provides null user by default', () => {
    render(
      <AuthProvider children={undefined}>
        <TestConsumer />
      </AuthProvider>
    );
    expect(screen.getByTestId('username')).toHaveTextContent('no-user');
  });

  it('login() updates user after fetch', async () => {
    render(
      <AuthProvider children={undefined}>
        <TestConsumer />
      </AuthProvider>
    );
    await userEvent.click(screen.getByText('Login'));
    // wait for the profile fetch to complete
    await waitFor(() =>
      expect(screen.getByTestId('username')).toHaveTextContent('bob')
    );
  });

  it('logout() clears user', async () => {
    render(
      <AuthProvider children={undefined}>
        <TestConsumer />
      </AuthProvider>
    );
    await userEvent.click(screen.getByText('Login'));
    await waitFor(() =>
      expect(screen.getByTestId('username')).toHaveTextContent('bob')
    );
    await userEvent.click(screen.getByText('Logout'));
    expect(screen.getByTestId('username')).toHaveTextContent('no-user');
  });

  it('redirects to login when profile 401s', async () => {
    // force the /me call to 401
    server.use(
      rest.get('http://localhost:8002/users/me', (req: any, res: (arg0: any) => any, ctx: { status: (arg0: number) => any; }) => res(ctx.status(401)))
    );

    // spy on window.location to catch the redirect
    delete (window as any).location;
    (window as any).location = { href: '' };

    render(
      <AuthProvider children={undefined}>
        <TestConsumer />
      </AuthProvider>
    );
    await userEvent.click(screen.getByText('Login'));
    // login will succeed but /me will 401
    await waitFor(() => {
      expect(window.location.href).toBe('/');
    });
  });
});