// ✅ Runs before every Jest test
import '@testing-library/jest-dom';

// Prevent "not implemented: window.alert" errors
window.alert = jest.fn();

// ✅ Fix for axios ESM import issue (CRA Jest doesn’t handle it natively)
jest.mock('axios', () => {
  return {
    create: jest.fn(() => ({
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    })),
  };
});
