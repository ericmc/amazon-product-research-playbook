import { describe, it, expect } from 'vitest';
import { sanitizeSelectValue, sanitizeSelectOptions, createSelectOption } from '@/utils/select';

describe('select utilities', () => {
  describe('sanitizeSelectValue', () => {
    it('should handle valid strings', () => {
      expect(sanitizeSelectValue('valid value')).toBe('valid value');
      expect(sanitizeSelectValue('  trimmed  ')).toBe('trimmed');
    });

    it('should handle invalid inputs', () => {
      expect(sanitizeSelectValue('')).toBe('');
      expect(sanitizeSelectValue(null)).toBe('');
      expect(sanitizeSelectValue(undefined)).toBe('');
      expect(sanitizeSelectValue(123 as any)).toBe('');
    });
  });

  describe('sanitizeSelectOptions', () => {
    it('should filter out empty value options', () => {
      const options = [
        { value: 'valid', label: 'Valid Option' },
        { value: '', label: 'Empty Value' },
        { value: '  ', label: 'Whitespace Only' },
        { value: 'another', label: 'Another Valid' }
      ];

      const result = sanitizeSelectOptions(options);
      expect(result).toHaveLength(2);
      expect(result[0].value).toBe('valid');
      expect(result[1].value).toBe('another');
    });

    it('should handle missing labels', () => {
      const options = [
        { value: 'test', label: '' },
        { value: 'another', label: 'Has Label' }
      ];

      const result = sanitizeSelectOptions(options);
      expect(result[0].label).toBe('test'); // Should use value as label
      expect(result[1].label).toBe('Has Label');
    });
  });

  describe('createSelectOption', () => {
    it('should create valid option objects', () => {
      const option = createSelectOption('test-value', 'Test Label');
      expect(option).toEqual({
        value: 'test-value',
        label: 'Test Label'
      });
    });

    it('should use value as label when label not provided', () => {
      const option = createSelectOption('test-value');
      expect(option).toEqual({
        value: 'test-value',
        label: 'test-value'
      });
    });

    it('should sanitize the value', () => {
      const option = createSelectOption('  spaced  ', 'Clean Label');
      expect(option.value).toBe('spaced');
      expect(option.label).toBe('Clean Label');
    });
  });
});