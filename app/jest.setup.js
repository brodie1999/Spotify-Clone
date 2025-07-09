import '@testing-library/jest-dom/extend-expect';

import { server } from './src/mocks/server';

// Start MSW before all tests
beforeAll(() => server.listen());

// Reset any request handlers (Isolate tests)
afterEach(() => {
    server.resetHandlers();
    localStorage.clear();
});

// Clean up once tests are done
afterAll(() => server.close());