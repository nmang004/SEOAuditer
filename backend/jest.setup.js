// Jest setup file for backend tests
const { config } = require('dotenv');

// Load environment variables for testing
config({ path: '.env' });

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-that-is-32-characters-long';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Increase timeout for database operations
jest.setTimeout(30000);

// Mock Redis client for tests
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn().mockResolvedValue(true),
    disconnect: jest.fn().mockResolvedValue(true),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    hSet: jest.fn(),
    hGetAll: jest.fn(),
    sAdd: jest.fn(),
    sMembers: jest.fn(),
    sRem: jest.fn()
  }))
}));

// Console suppression for cleaner test output
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
}); 