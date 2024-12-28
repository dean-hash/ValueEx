import { config } from 'dotenv';

// Load environment variables
config();

// Increase timeout for all tests
jest.setTimeout(30000);

// Global teardown
afterAll(async () => {
  // Add any global cleanup here
});
