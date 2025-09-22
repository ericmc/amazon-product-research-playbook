import Papa from 'papaparse';

export interface ParsedData {
  headers: string[];
  rows: string[][];
  delimiter: string;
}

export interface ParseOptions {
  skipEmptyLines?: boolean;
  trimHeaders?: boolean;
  trimCells?: boolean;
}

/**
 * Detect the most likely delimiter used in a CSV string
 */
export const detectDelimiter = (text: string): string => {
  const delimiters = [',', ';', '\t', '|'];
  const firstLine = text.split('\n')[0];
  
  let maxCount = 0;
  let bestDelimiter = ',';
  
  for (const delimiter of delimiters) {
    const count = (firstLine.match(new RegExp(`\\${delimiter}`, 'g')) || []).length;
    if (count > maxCount) {
      maxCount = count;
      bestDelimiter = delimiter;
    }
  }
  
  return bestDelimiter;
};

/**
 * Parse CSV text using Papa Parse with consistent options
 */
export const parseCSV = (text: string, options: ParseOptions = {}): ParsedData => {
  const {
    skipEmptyLines = true,
    trimHeaders = true,
    trimCells = true
  } = options;

  // Auto-detect delimiter if not specified
  const delimiter = detectDelimiter(text);
  
  const result = Papa.parse(text, {
    delimiter,
    skipEmptyLines: skipEmptyLines ? 'greedy' : false,
    transform: trimCells ? (value: string) => value.trim() : undefined,
    header: false
  });

  if (result.errors.length > 0) {
    console.warn('CSV parsing warnings:', result.errors);
  }

  const rawData = result.data as string[][];
  
  if (rawData.length === 0) {
    throw new Error('CSV file is empty');
  }

  // Extract headers and clean them
  const headers = rawData[0].map(h => 
    trimHeaders ? h.trim().replace(/['"]/g, '') : h
  );
  
  // Extract data rows and filter empty ones
  const rows = rawData.slice(1).filter(row => 
    row.some(cell => cell && cell.length > 0)
  );

  return { headers, rows, delimiter };
};

/**
 * Parse CSV file using File API
 */
export const parseCSVFile = (file: File, options?: ParseOptions): Promise<ParsedData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = parseCSV(text, options);
        resolve(parsed);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
};