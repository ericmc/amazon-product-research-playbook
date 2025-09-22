/**
 * Parse and normalize Helium 10 Magnet/Cerebro CSV data
 * Enhanced with better validation and performance for large datasets
 */

import { parseCSVFile } from './parseCsv';

export interface MagnetRow {
  keyword: string;
  searchVolume: number;
  competingProducts: number;
  rawData: Record<string, any>;
}

export interface MagnetParseResult {
  success: boolean;
  data: MagnetRow[];
  warnings: string[];
  errors: string[];
  stats: {
    totalRows: number;
    validKeywords: number;
    withVolume: number;
    withCompeting: number;
  };
}

const MAGNET_FIELD_MAPPINGS = {
  keyword: ['keyword', 'search term', 'phrase', 'query'],
  searchVolume: ['search volume', 'volume', 'monthly volume', 'searches', 'monthly searches'],
  competingProducts: ['competing products', 'products', 'product count', 'asin count', 'competing', 'total products']
};

function findMappedHeader(headers: string[], fieldMappings: string[]): string | null {
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
  
  // Try exact matches first
  for (const mapping of fieldMappings) {
    const exactMatch = normalizedHeaders.find(h => h === mapping);
    if (exactMatch) {
      return headers[normalizedHeaders.indexOf(exactMatch)];
    }
  }
  
  // Then try contains matches
  for (const mapping of fieldMappings) {
    const found = normalizedHeaders.find(h => h.includes(mapping));
    if (found) {
      return headers[normalizedHeaders.indexOf(found)];
    }
  }
  return null;
}

function coerceNumber(value: any): number {
  if (typeof value === 'number' && !isNaN(value)) return Math.max(0, value);
  if (typeof value === 'string') {
    const cleaned = value.replace(/[,$%]/g, '').trim();
    if (cleaned === '' || cleaned === '-' || cleaned === 'N/A') return 0;
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : Math.max(0, num);
  }
  return 0;
}

/**
 * Enhanced Magnet CSV parser with better validation and error handling
 */
export async function parseMagnetCSV(file: File): Promise<MagnetParseResult> {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  try {
    const parsed = await parseCSVFile(file);
    
    if (!parsed.rows || parsed.rows.length === 0) {
      return {
        success: false,
        data: [],
        warnings,
        errors: ['No data rows found in CSV file'],
        stats: { totalRows: 0, validKeywords: 0, withVolume: 0, withCompeting: 0 }
      };
    }

    const headers = parsed.headers;
    
    // Find mapped headers with validation
    const keywordHeader = findMappedHeader(headers, MAGNET_FIELD_MAPPINGS.keyword);
    const volumeHeader = findMappedHeader(headers, MAGNET_FIELD_MAPPINGS.searchVolume);
    const productsHeader = findMappedHeader(headers, MAGNET_FIELD_MAPPINGS.competingProducts);

    // Validation warnings
    if (!keywordHeader) {
      errors.push('Required keyword column not found. Expected columns: keyword, search term, phrase');
      return {
        success: false,
        data: [],
        warnings,
        errors,
        stats: { totalRows: parsed.rows.length, validKeywords: 0, withVolume: 0, withCompeting: 0 }
      };
    }

    if (!volumeHeader) {
      warnings.push('Search volume column not found - volume data will be set to 0');
    }

    if (!productsHeader) {
      warnings.push('Competing products column not found - competing data will be set to 0');
    }

    // Process rows with performance optimization for large datasets
    const magnetRows: MagnetRow[] = [];
    let validKeywords = 0;
    let withVolume = 0;
    let withCompeting = 0;

    const batchSize = 100;
    const totalRows = parsed.rows.length;
    
    for (let i = 0; i < totalRows; i += batchSize) {
      const batch = parsed.rows.slice(i, i + batchSize);
      
      for (const row of batch) {
        const rowData: Record<string, any> = {};
        headers.forEach((header, index) => {
          rowData[header] = row[index] || '';
        });

        const keyword = rowData[keywordHeader]?.toString().trim();
        if (!keyword || keyword.length < 2) continue; // Skip very short keywords

        const searchVolume = volumeHeader ? coerceNumber(rowData[volumeHeader]) : 0;
        const competingProducts = productsHeader ? coerceNumber(rowData[productsHeader]) : 0;

        magnetRows.push({
          keyword,
          searchVolume,
          competingProducts,
          rawData: rowData
        });

        validKeywords++;
        if (searchVolume > 0) withVolume++;
        if (competingProducts > 0) withCompeting++;
      }
      
      // Allow UI to breathe for very large datasets
      if (totalRows > 1000 && i % 500 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1));
      }
    }

    // Performance warnings
    if (totalRows > 10000) {
      warnings.push(`Large dataset detected (${totalRows.toLocaleString()} rows). Processing may take a moment.`);
    }

    if (validKeywords === 0) {
      errors.push('No valid keywords found in the data');
      return {
        success: false,
        data: [],
        warnings,
        errors,
        stats: { totalRows, validKeywords: 0, withVolume: 0, withCompeting: 0 }
      };
    }

    return {
      success: true,
      data: magnetRows,
      warnings,
      errors,
      stats: {
        totalRows,
        validKeywords,
        withVolume,
        withCompeting
      }
    };
    
  } catch (error) {
    return {
      success: false,
      data: [],
      warnings,
      errors: [`Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      stats: { totalRows: 0, validKeywords: 0, withVolume: 0, withCompeting: 0 }
    };
  }
}