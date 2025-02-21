import '@jest/globals';
import '@testing-library/jest-dom';
import { config } from 'dotenv';

// Load environment variables
config();

// Mock console methods for cleaner test output
jest.spyOn(global.console, 'log').mockImplementation(() => {});
jest.spyOn(global.console, 'error').mockImplementation(() => {});
jest.spyOn(global.console, 'warn').mockImplementation(() => {});
jest.spyOn(global.console, 'info').mockImplementation(() => {});

// Mock fetch API
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    ok: true,
    status: 200,
    headers: new Headers(),
  } as Response)
);

// Global test configuration
beforeAll(() => {
  jest.setTimeout(10000);
});

afterAll(() => {
  jest.clearAllMocks();
});
