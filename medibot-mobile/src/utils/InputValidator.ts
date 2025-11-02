/**
 * Input validation utilities for MediBot
 * Provides strict validation for all user input fields to prevent exceptions
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  formatted?: string;
}

export class InputValidator {
  
  /**
   * Validates and formats email addresses
   */
  static validateEmail(email: string): ValidationResult {
    try {
      const trimmed = email.trim().toLowerCase();
      
      if (!trimmed) {
        return { isValid: false, error: 'Email is required' };
      }
      
      // RFC 5322 compliant regex (simplified)
      const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      
      if (!emailRegex.test(trimmed)) {
        return { isValid: false, error: 'Please enter a valid email address' };
      }
      
      if (trimmed.length > 254) {
        return { isValid: false, error: 'Email address is too long' };
      }
      
      return { isValid: true, formatted: trimmed };
    } catch (error) {
      return { isValid: false, error: 'Invalid email format' };
    }
  }
  
  /**
   * Validates and formats phone numbers
   */
  static validatePhoneNumber(phone: string): ValidationResult {
    try {
      // Allow empty phone numbers as they're optional
      if (!phone.trim()) {
        return { isValid: true, formatted: '' };
      }
      
      // Remove all non-digit, non-space, non-hyphen, non-parenthesis, non-plus characters
      const cleaned = phone.replace(/[^0-9\s\-\(\)\+]/g, '');
      
      // Basic phone number patterns
      const phonePatterns = [
        /^\+\d{1,3}\s?\d{3,14}$/, // International format
        /^\(\d{3}\)\s?\d{3}-?\d{4}$/, // US format with parentheses
        /^\d{3}-?\d{3}-?\d{4}$/, // US format with hyphens
        /^\d{10}$/, // Simple 10 digit
        /^\d{11}$/, // 11 digit with country code
      ];
      
      const isValid = phonePatterns.some(pattern => pattern.test(cleaned));
      
      if (!isValid) {
        return { 
          isValid: false, 
          error: 'Please enter a valid phone number (e.g., +1 555-123-4567 or (555) 123-4567)' 
        };
      }
      
      return { isValid: true, formatted: cleaned };
    } catch (error) {
      return { isValid: false, error: 'Invalid phone number format' };
    }
  }
  
  /**
   * Validates and formats date of birth (DD/MM/YYYY)
   */
  static validateDateOfBirth(dateStr: string): ValidationResult {
    try {
      if (!dateStr.trim()) {
        return { isValid: true, formatted: '' }; // Optional field
      }
      
      // Expected format: DD/MM/YYYY
      const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
      const match = dateStr.match(dateRegex);
      
      if (!match) {
        return { 
          isValid: false, 
          error: 'Please enter date in DD/MM/YYYY format' 
        };
      }
      
      const [, dayStr, monthStr, yearStr] = match;
      const day = parseInt(dayStr, 10);
      const month = parseInt(monthStr, 10);
      const year = parseInt(yearStr, 10);
      
      // Validate ranges
      if (day < 1 || day > 31) {
        return { isValid: false, error: 'Day must be between 1 and 31' };
      }
      
      if (month < 1 || month > 12) {
        return { isValid: false, error: 'Month must be between 1 and 12' };
      }
      
      const currentYear = new Date().getFullYear();
      if (year < 1900 || year > currentYear) {
        return { 
          isValid: false, 
          error: `Year must be between 1900 and ${currentYear}` 
        };
      }
      
      // Create date object to validate (month is 0-indexed in JS)
      const date = new Date(year, month - 1, day);
      
      // Check if the date is valid (e.g., not Feb 30)
      if (date.getDate() !== day || 
          date.getMonth() !== month - 1 || 
          date.getFullYear() !== year) {
        return { isValid: false, error: 'Please enter a valid date' };
      }
      
      // Check if date is not in the future
      if (date > new Date()) {
        return { isValid: false, error: 'Date of birth cannot be in the future' };
      }
      
      // Format as DD/MM/YYYY with leading zeros
      const formatted = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
      
      return { isValid: true, formatted };
    } catch (error) {
      return { isValid: false, error: 'Invalid date format' };
    }
  }
  
  /**
   * Validates name fields (allows letters, spaces, hyphens, apostrophes)
   */
  static validateName(name: string, fieldName: string = 'Name'): ValidationResult {
    try {
      const trimmed = name.trim();
      
      if (!trimmed) {
        return { isValid: false, error: `${fieldName} is required` };
      }
      
      // Allow letters, spaces, hyphens, apostrophes, and common international characters
      const nameRegex = /^[a-zA-ZÀ-ÿĀ-žА-я\s\-'\.]+$/;
      
      if (!nameRegex.test(trimmed)) {
        return { 
          isValid: false, 
          error: `${fieldName} can only contain letters, spaces, hyphens, and apostrophes` 
        };
      }
      
      if (trimmed.length < 2) {
        return { isValid: false, error: `${fieldName} must be at least 2 characters long` };
      }
      
      if (trimmed.length > 100) {
        return { isValid: false, error: `${fieldName} must be less than 100 characters` };
      }
      
      return { isValid: true, formatted: trimmed };
    } catch (error) {
      return { isValid: false, error: `Invalid ${fieldName.toLowerCase()} format` };
    }
  }
  
  /**
   * Validates medical text fields (allows broader character set)
   */
  static validateMedicalText(text: string, fieldName: string, maxLength: number = 500): ValidationResult {
    try {
      // Allow empty medical fields
      if (!text.trim()) {
        return { isValid: true, formatted: '' };
      }
      
      const trimmed = text.trim();
      
      if (trimmed.length > maxLength) {
        return { 
          isValid: false, 
          error: `${fieldName} must be less than ${maxLength} characters` 
        };
      }
      
      // Remove any potentially harmful characters but allow medical terminology
      const cleaned = trimmed.replace(/[<>{}]/g, '');
      
      return { isValid: true, formatted: cleaned };
    } catch (error) {
      return { isValid: false, error: `Invalid ${fieldName.toLowerCase()} format` };
    }
  }
  
  /**
   * Auto-formats phone number as user types
   */
  static formatPhoneNumberInput(input: string, previousValue: string = ''): string {
    try {
      // Remove all non-digits except + at the start
      let cleaned = input.replace(/[^+0-9]/g, '');
      
      // Handle international format
      if (cleaned.startsWith('+')) {
        const digits = cleaned.slice(1).replace(/\D/g, '');
        if (digits.length <= 15) { // ITU-T E.164 standard
          return '+' + digits;
        }
        return previousValue;
      }
      
      // Handle US/Canada format
      const digits = cleaned.replace(/\D/g, '');
      
      if (digits.length <= 3) {
        return digits;
      } else if (digits.length <= 6) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
      } else if (digits.length <= 10) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
      } else if (digits.length === 11 && digits.startsWith('1')) {
        return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
      }
      
      return previousValue; // Don't allow more than 11 digits for US numbers
    } catch (error) {
      return previousValue;
    }
  }
  
  /**
   * Auto-formats date as user types (DD/MM/YYYY)
   */
  static formatDateInput(input: string, previousValue: string = ''): string {
    try {
      // Remove all non-digits
      const digits = input.replace(/\D/g, '');
      
      if (digits.length === 0) return '';
      if (digits.length <= 2) return digits;
      if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
      if (digits.length <= 8) return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
      
      // Don't allow more than 8 digits
      return previousValue;
    } catch (error) {
      return previousValue;
    }
  }
}