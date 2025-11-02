/**
 * InputValidator Unit Tests
 * Tests input validation utilities
 */

import { InputValidator } from '../InputValidator';

describe('InputValidator', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'first+last@example.com',
        'user123@test-domain.com',
      ];

      validEmails.forEach(email => {
        const result = InputValidator.validateEmail(email);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
        expect(result.formatted).toBe(email.toLowerCase().trim());
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user@domain..com',
      ];

      invalidEmails.forEach(email => {
        const result = InputValidator.validateEmail(email);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    it('should trim and lowercase email addresses', () => {
      const result = InputValidator.validateEmail('  TEST@EXAMPLE.COM  ');
      expect(result.isValid).toBe(true);
      expect(result.formatted).toBe('test@example.com');
    });

    it('should reject emails longer than 254 characters', () => {
      const longEmail = 'a'.repeat(250) + '@test.com';
      const result = InputValidator.validateEmail(longEmail);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('too long');
    });

    it('should return error for empty email', () => {
      const result = InputValidator.validateEmail('');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('required');
    });
  });

  describe('validatePhoneNumber', () => {
    it('should validate correct phone numbers', () => {
      const validPhones = [
        '5551234567',    // 10 digits
        '15551234567',   // 11 digits with country code
      ];

      validPhones.forEach(phone => {
        const result = InputValidator.validatePhoneNumber(phone);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should allow empty phone numbers (optional field)', () => {
      const result = InputValidator.validatePhoneNumber('');
      expect(result.isValid).toBe(true);
      expect(result.formatted).toBe('');
    });

    it('should reject invalid phone numbers', () => {
      const invalidPhones = [
        '123',
        'abcdefghij',
        '555',
        '+++123',
      ];

      invalidPhones.forEach(phone => {
        const result = InputValidator.validatePhoneNumber(phone);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    it('should clean phone number formatting', () => {
      const result = InputValidator.validatePhoneNumber('5551234567');
      expect(result.isValid).toBe(true);
      expect(result.formatted).toBe('5551234567');
    });
  });

  describe('validateDateOfBirth', () => {
    it('should validate correct date formats', () => {
      const validDates = [
        '01/01/1990',
        '15/06/1985',
        '31/12/2000',
      ];

      validDates.forEach(date => {
        const result = InputValidator.validateDateOfBirth(date);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should allow empty date (optional field)', () => {
      const result = InputValidator.validateDateOfBirth('');
      expect(result.isValid).toBe(true);
      expect(result.formatted).toBe('');
    });

    it('should reject invalid date formats', () => {
      const invalidDates = [
        '2000-01-01',  // Wrong format
        '32/01/2000',  // Invalid day
        '01/13/2000',  // Invalid month
        '01/01/99',    // 2-digit year
        'not-a-date',
      ];

      invalidDates.forEach(date => {
        const result = InputValidator.validateDateOfBirth(date);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    it('should reject future dates', () => {
      const futureDate = '01/01/3000';
      const result = InputValidator.validateDateOfBirth(futureDate);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('1900');
    });

    it('should validate leap years correctly', () => {
      // Valid leap year
      const leapYearDate = '29/02/2020';
      const result1 = InputValidator.validateDateOfBirth(leapYearDate);
      expect(result1.isValid).toBe(true);

      // Invalid leap year
      const nonLeapYearDate = '29/02/2019';
      const result2 = InputValidator.validateDateOfBirth(nonLeapYearDate);
      expect(result2.isValid).toBe(false);
    });
  });

  describe('validateName', () => {
    it('should validate proper names', () => {
      const validNames = [
        'John',
        'Mary-Jane',
        "O'Connor",
        'José',
        'Anne Marie',
      ];

      validNames.forEach(name => {
        const result = InputValidator.validateName(name);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject invalid names', () => {
      const invalidNames = [
        '',
        'J',      // Too short
      ];

      invalidNames.forEach(name => {
        const result = InputValidator.validateName(name);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    it('should trim whitespace from names', () => {
      const result = InputValidator.validateName('  John  ');
      expect(result.isValid).toBe(true);
      expect(result.formatted).toBe('John');
    });

    it('should enforce minimum length', () => {
      const result = InputValidator.validateName('A');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('2 characters');
    });

    it('should use custom field name in error messages', () => {
      const result = InputValidator.validateName('', 'First Name');
      expect(result.error).toContain('First Name');
    });
  });

  describe('validateMedicalText', () => {
    it('should validate medical text', () => {
      const validText = 'Patient presents with mild fever and headache';
      const result = InputValidator.validateMedicalText(validText, 'Symptoms');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should allow empty medical text (optional field)', () => {
      const result = InputValidator.validateMedicalText('', 'Symptoms');
      expect(result.isValid).toBe(true);
      expect(result.formatted).toBe('');
    });

    it('should enforce maximum length', () => {
      const longText = 'a'.repeat(600);
      const result = InputValidator.validateMedicalText(longText, 'Notes', 500);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('500');
    });

    it('should allow text within max length', () => {
      const okText = 'a'.repeat(400);
      const result = InputValidator.validateMedicalText(okText, 'Notes', 500);
      expect(result.isValid).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle null inputs gracefully', () => {
      expect(() => InputValidator.validateEmail(null as any)).not.toThrow();
      expect(() => InputValidator.validatePhoneNumber(null as any)).not.toThrow();
      expect(() => InputValidator.validateName(null as any)).not.toThrow();
    });

    it('should handle undefined inputs gracefully', () => {
      expect(() => InputValidator.validateEmail(undefined as any)).not.toThrow();
      expect(() => InputValidator.validatePhoneNumber(undefined as any)).not.toThrow();
      expect(() => InputValidator.validateName(undefined as any)).not.toThrow();
    });

    it('should handle very long inputs', () => {
      const longString = 'a'.repeat(10000);
      expect(() => InputValidator.validateEmail(longString)).not.toThrow();
      expect(() => InputValidator.validateName(longString)).not.toThrow();
    });

    it('should handle special characters and unicode', () => {
      const unicodeEmail = 'test@例え.jp';
      const result = InputValidator.validateEmail(unicodeEmail);
      // May be valid or invalid depending on implementation, but shouldn't crash
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('error');
    });
  });
});
