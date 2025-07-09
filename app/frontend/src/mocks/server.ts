import { setupServer } from 'msw/node';
// @ts-ignore
import { rest } from 'msw';

const API_BASE = 'http://localhost:8002';

export const server = setupServer(
    // login endpoint
    rest.post(`${API_BASE}/users/login`, (req, res, ctx) =>
        res(ctx.json({ access_token: 'fake-token', token_type: 'bearer' }))
    ),

    // Profile endpoint
    rest.get(`${API_BASE}/users/me`, (req, res, ctx) => {
        const auth = req.headers.get('Authorization');
        if (auth === 'Bearer fake-token') {
            return res(ctx.json({ username: 'bob', email:'bob@gmail.com'}));
        }
        return res(ctx.status(401));

    })
);