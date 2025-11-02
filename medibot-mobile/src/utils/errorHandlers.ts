/**
 * Centralized error handling utilities
 * Provides robust error handling for common error-prone operations
 */

import Logger from '../services/Logger';

const loggerInstance = Logger;

/**
 * Safe array access with default value
 */
export function safeArrayAccess<T>(
  array: T[] | undefined | null,
  index: number,
  defaultValue?: T
): T | undefined {
  if (!array || !Array.isArray(array)) {
    return defaultValue;
  }
  if (index < 0 || index >= array.length) {
    return defaultValue;
  }
  return array[index] ?? defaultValue;
}

/**
 * Safe JSON parse with error handling
 */
export function safeJsonParse<T>(
  jsonString: string | null | undefined,
  defaultValue?: T
): T | undefined {
  if (!jsonString) {
    return defaultValue;
  }
  
  try {
    const parsed = JSON.parse(jsonString);
    return parsed as T;
  } catch (error) {
    loggerInstance.warn('JSON parse failed', { error, jsonString: jsonString.substring(0, 100) });
    return defaultValue;
  }
}

/**
 * Safe string operations
 */
export function safeStringOp(
  str: string | undefined | null,
  operation: (s: string) => string,
  defaultValue: string = ''
): string {
  if (!str || typeof str !== 'string' || str.length === 0) {
    return defaultValue;
  }
  
  try {
    return operation(str);
  } catch (error) {
    loggerInstance.warn('String operation failed', { error });
    return defaultValue;
  }
}

/**
 * Safe charAt with fallback
 */
export function safeCharAt(
  str: string | undefined | null,
  index: number,
  defaultChar: string = ''
): string {
  return safeStringOp(
    str,
    (s) => (index >= 0 && index < s.length ? s.charAt(index) : defaultChar),
    defaultChar
  );
}

/**
 * Safe substring with bounds checking
 */
export function safeSubstring(
  str: string | undefined | null,
  start: number,
  end?: number,
  defaultValue: string = ''
): string {
  if (!str || typeof str !== 'string') {
    return defaultValue;
  }
  
  const safeStart = Math.max(0, Math.min(start, str.length));
  const safeEnd = end !== undefined ? Math.max(0, Math.min(end, str.length)) : str.length;
  
  return str.substring(safeStart, safeEnd);
}

/**
 * Network error handler with user-friendly messages
 */
export function handleNetworkError(error: unknown): Error {
  if (error instanceof TypeError && error.message.includes('network')) {
    return new Error('Network connection failed. Please check your internet connection.');
  }
  
  if (error instanceof DOMException && error.name === 'TimeoutError') {
    return new Error('Request timed out. Please try again.');
  }
  
  if (error instanceof DOMException && error.name === 'AbortError') {
    return new Error('Request was cancelled.');
  }
  
  if (error instanceof Error) {
    return error;
  }
  
  return new Error('An unexpected error occurred. Please try again.');
}

/**
 * Safe fetch with timeout and error handling
 */
export async function safeFetch(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 30000
): Promise<Response> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    throw handleNetworkError(error);
  }
}

/**
 * Safe API response parser
 */
export async function safeParseResponse<T>(
  response: Response,
  expectedFields?: string[]
): Promise<T> {
  try {
    const data = await response.json();
    
    // Validate expected fields if provided
    if (expectedFields && expectedFields.length > 0) {
      const missingFields = expectedFields.filter(field => !(field in data));
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }
    }
    
    return data as T;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid response format from server');
    }
    throw error;
  }
}

/**
 * Retry operation with exponential backoff
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        loggerInstance.info(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`, { error: lastError });
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Operation failed after retries');
}

/**
 * Safe parseInt with default value
 */
export function safeParseInt(
  value: string | number | undefined | null,
  defaultValue: number = 0
): number {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  
  const parsed = typeof value === 'string' ? parseInt(value, 10) : value;
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Safe parseFloat with default value
 */
export function safeParseFloat(
  value: string | number | undefined | null,
  defaultValue: number = 0.0
): number {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  
  const parsed = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Validate array and ensure it's not empty
 */
export function ensureArray<T>(
  value: T[] | undefined | null,
  minLength: number = 1
): T[] {
  if (!value || !Array.isArray(value)) {
    return [];
  }
  
  return value.length >= minLength ? value : [];
}

/**
 * Safe object property access
 */
export function safeGet<T, K extends keyof T>(
  obj: T | undefined | null,
  key: K,
  defaultValue?: T[K]
): T[K] | undefined {
  if (!obj || typeof obj !== 'object') {
    return defaultValue;
  }
  
  return obj[key] ?? defaultValue;
}
