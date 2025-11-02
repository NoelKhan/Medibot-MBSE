/**
 * ErrorHandlers Unit Tests
 * Tests error handling utilities
 */

// Mock the Logger service
jest.mock('../../services/Logger');

import {
  safeArrayAccess,
  safeJsonParse,
  safeStringOp,
  handleNetworkError,
} from '../errorHandlers';

describe('ErrorHandlers', () => {
  describe('safeArrayAccess', () => {
    it('should safely access array elements', () => {
      const array = ['first', 'second', 'third'];

      expect(safeArrayAccess(array, 0)).toBe('first');
      expect(safeArrayAccess(array, 1)).toBe('second');
      expect(safeArrayAccess(array, 2)).toBe('third');
    });

    it('should return undefined for out-of-bounds access', () => {
      const array = ['first', 'second'];

      expect(safeArrayAccess(array, 5)).toBeUndefined();
      expect(safeArrayAccess(array, -1)).toBeUndefined();
    });

    it('should return default value for out-of-bounds access', () => {
      const array = ['first', 'second'];

      expect(safeArrayAccess(array, 5, 'default')).toBe('default');
    });

    it('should handle null/undefined arrays', () => {
      expect(safeArrayAccess(null, 0)).toBeUndefined();
      expect(safeArrayAccess(undefined, 0)).toBeUndefined();
      expect(safeArrayAccess(null, 0, 'default')).toBe('default');
    });

    it('should handle empty arrays', () => {
      expect(safeArrayAccess([], 0)).toBeUndefined();
      expect(safeArrayAccess([], 0, 'default')).toBe('default');
    });
  });

  describe('safeJsonParse', () => {
    it('should parse valid JSON strings', () => {
      const jsonString = '{"name":"John","age":30}';
      const result = safeJsonParse(jsonString);

      expect(result).toEqual({ name: 'John', age: 30 });
    });

    it('should parse JSON arrays', () => {
      const jsonString = '[1,2,3,4,5]';
      const result = safeJsonParse(jsonString);

      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    it('should return default value for invalid JSON', () => {
      const invalidJson = '{invalid json}';
      const result = safeJsonParse(invalidJson, { fallback: true });

      expect(result).toEqual({ fallback: true });
    });

    it('should handle null/undefined input', () => {
      expect(safeJsonParse(null)).toBeUndefined();
      expect(safeJsonParse(undefined)).toBeUndefined();
      expect(safeJsonParse(null, { default: 'value' })).toEqual({ default: 'value' });
    });

    it('should not throw on malformed JSON', () => {
      expect(() => safeJsonParse('{')).not.toThrow();
      expect(() => safeJsonParse('{]')).not.toThrow();
      expect(() => safeJsonParse('undefined')).not.toThrow();
    });
  });

  describe('safeStringOp', () => {
    it('should safely operate on strings', () => {
      const result = safeStringOp('hello', (s) => s.toUpperCase());
      expect(result).toBe('HELLO');
    });

    it('should handle null/undefined strings', () => {
      const result1 = safeStringOp(null, (s) => s.toUpperCase());
      expect(result1).toBe('');

      const result2 = safeStringOp(undefined, (s) => s.toUpperCase());
      expect(result2).toBe('');
    });

    it('should return default value on null input', () => {
      const result = safeStringOp(null, (s) => s.toUpperCase(), 'DEFAULT');
      expect(result).toBe('DEFAULT');
    });

    it('should catch errors in operation and return default', () => {
      const operation = (s: string) => {
        throw new Error('Operation failed');
      };

      const result = safeStringOp('test', operation, 'fallback');
      expect(result).toBe('fallback');
    });
  });

  describe('handleNetworkError', () => {
    it('should format network errors with user-friendly messages', () => {
      const error = new Error('Network request failed');
      const result = handleNetworkError(error);

      expect(result).toBeDefined();
      expect(result.message).toBeTruthy();
      expect(typeof result.message).toBe('string');
    });

    it('should handle various error formats', () => {
      expect(() => handleNetworkError(new Error('test'))).not.toThrow();
      expect(() => handleNetworkError({ message: 'test' } as any)).not.toThrow();
      expect(() => handleNetworkError(null as any)).not.toThrow();
    });
  });

  describe('error handling robustness', () => {
    it('should never throw exceptions', () => {
      expect(() => safeArrayAccess(null as any, NaN)).not.toThrow();
      expect(() => safeJsonParse('{[]}' as any)).not.toThrow();
      expect(() => safeStringOp(123 as any, (s: any) => s.toUpperCase())).not.toThrow();
    });

    it('should provide meaningful default values', () => {
      expect(safeArrayAccess(null, 0, [])).toEqual([]);
      expect(safeJsonParse('invalid', {})).toEqual({});
    });
  });
});
