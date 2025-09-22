/**
 * Performance utilities for handling large datasets
 */

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Process large arrays in chunks to prevent UI blocking
 */
export async function processInChunks<T, R>(
  items: T[],
  processor: (item: T, index: number) => R,
  chunkSize: number = 100,
  delay: number = 1
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const chunkResults = chunk.map((item, index) => processor(item, i + index));
    results.push(...chunkResults);
    
    // Allow UI to breathe
    if (delay > 0 && i + chunkSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return results;
}

/**
 * Batch async operations to avoid overwhelming the system
 */
export async function batchAsync<T, R>(
  items: T[],
  asyncProcessor: (item: T) => Promise<R>,
  batchSize: number = 10
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(asyncProcessor));
    results.push(...batchResults);
  }
  
  return results;
}