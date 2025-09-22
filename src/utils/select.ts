/**
 * Utility functions for sanitizing select options and preventing empty value errors
 */

export const sanitizeSelectValue = (value: string | undefined | null): string => {
  if (!value || typeof value !== 'string') return '';
  return value.trim();
};

export const sanitizeSelectOptions = (options: Array<{value: string, label: string}>): Array<{value: string, label: string}> => {
  return options.filter(option => {
    const cleanValue = sanitizeSelectValue(option.value);
    return cleanValue.length > 0;
  }).map(option => ({
    ...option,
    value: sanitizeSelectValue(option.value),
    label: option.label || option.value
  }));
};

export const createSelectOption = (value: string, label?: string): {value: string, label: string} => {
  const cleanValue = sanitizeSelectValue(value);
  return {
    value: cleanValue,
    label: label || cleanValue
  };
};