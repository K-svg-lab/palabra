import '@testing-library/jest-dom';

// Mock environment variables for tests
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.OPENAI_API_KEY = 'test-key';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

// Mock fetch globally
global.fetch = jest.fn();

// Mock IndexedDB for offline storage tests
const indexedDB = require('fake-indexeddb');
const IDBKeyRange = require('fake-indexeddb/lib/FDBKeyRange');

global.indexedDB = indexedDB;
global.IDBKeyRange = IDBKeyRange;

// Suppress console errors in tests (optional)
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalError;
});
