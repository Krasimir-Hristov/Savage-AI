import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// MSW Node server — used in test/setup.ts
export const server = setupServer(...handlers);
