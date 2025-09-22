/**
 * Parse and normalize Helium 10 Magnet/Cerebro CSV data
 */

import { parseCSVFile } from './parseCsv';

export interface MagnetRow {
  keyword: string;
  searchVolume: number;
  competingProducts: number;
  rawData: Record<string, any>;
}

const MAGNET_FIELD_MAPPINGS = {
  keyword: ['keyword', 'search term', 'phrase'],
  searchVolume: ['search volume', 'volume', 'monthly volume', 'searches'],
  competingProducts: ['competing products', 'products', 'product count', 'asin count', 'competing']
};

function findMappedHeader(headers: string[], fieldMappings: string[]): string | null {
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
  
  for (const mapping of fieldMappings) {
    const found = normalizedHeaders.find(h => h.includes(mapping));
    if (found) {
      return headers[normalizedHeaders.indexOf(found)];
    }
  }
  return null;
}

function coerceNumber(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[,$]/g, '').trim();
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }
  return 0;
}

export async function parseMagnetCSV(file: File): Promise<MagnetRow[]> {
  const parsed = await parseCSVFile(file);
  
  if (!parsed.rows || parsed.rows.length === 0) {
    throw new Error('No data found in CSV file');
  }

  const headers = parsed.headers;
  
  // Find mapped headers
  const keywordHeader = findMappedHeader(headers, MAGNET_FIELD_MAPPINGS.keyword);
  const volumeHeader = findMappedHeader(headers, MAGNET_FIELD_MAPPINGS.searchVolume);
  const productsHeader = findMappedHeader(headers, MAGNET_FIELD_MAPPINGS.competingProducts);

  if (!keywordHeader) {
    throw new Error('Could not find keyword column in CSV');
  }

  const magnetRows: MagnetRow[] = [];

  for (const row of parsed.rows) {
    const rowData: Record<string, any> = {};
    headers.forEach((header, index) => {
      rowData[header] = row[index] || '';
    });

    const keyword = rowData[keywordHeader || '']?.toString().trim();
    if (!keyword) continue;

    const searchVolume = volumeHeader ? coerceNumber(rowData[volumeHeader]) : 0;
    const competingProducts = productsHeader ? coerceNumber(rowData[productsHeader]) : 0;

    magnetRows.push({
      keyword,
      searchVolume,
      competingProducts,
      rawData: rowData
    });
  }

  return magnetRows;
}