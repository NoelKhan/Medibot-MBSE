/**
 * Mock Logger Service for testing
 */

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  log: jest.fn(),
};

const LoggerService = {
  getInstance: jest.fn(() => mockLogger),
};

export default LoggerService;
