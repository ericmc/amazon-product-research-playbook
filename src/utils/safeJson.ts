/**
 * Safe JSON parsing utilities to prevent app crashes from malformed data
 */

/**
 * Safely parse JSON string with fallback value
 * @param text - JSON string to parse
 * @param fallback - Value to return if parsing fails
 * @returns Parsed object or fallback value
 */
export function safeParse<T>(text: string | null | undefined, fallback: T): T {
  if (!text || text.trim() === '') {
    return fallback;
  }

  try {
    const parsed = JSON.parse(text);
    return parsed !== null && parsed !== undefined ? parsed : fallback;
  } catch (error) {
    console.warn('JSON parse error:', error, 'Input:', text);
    return fallback;
  }
}

/**
 * Safely parse JSON from localStorage with quota/undefined guards
 * @param key - localStorage key
 * @param fallback - Value to return if key doesn't exist or parsing fails
 * @returns Parsed object or fallback value
 */
export function safeParseLocalStorage<T>(key: string, fallback: T): T {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return fallback;
    }

    const item = localStorage.getItem(key);
    return safeParse(item, fallback);
  } catch (error) {
    // Handle quota exceeded, storage disabled, etc.
    console.warn('LocalStorage access error:', error);
    return fallback;
  }
}

/**
 * Safely stringify object for storage
 * @param value - Value to stringify
 * @param fallback - String to return if stringification fails
 * @returns JSON string or fallback
 */
export function safeStringify(value: any, fallback: string = '{}'): string {
  try {
    return JSON.stringify(value);
  } catch (error) {
    console.warn('JSON stringify error:', error, 'Value:', value);
    return fallback;
  }
}