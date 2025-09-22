import { describe, it, expect } from 'vitest';

// Mock the parseCsv module since we're testing the logic, not file parsing
const mockParseResult = {
  headers: ['Keyword', 'Search Volume', 'Competing Products'],
  rows: [
    ['dog toys', '15000', '850'],
    ['cat food', '25000', '1200'],
    ['', '0', '0'], // Empty keyword
    ['pet supplies', 'invalid', '500'], // Invalid volume
    ['bird cage', '5000', 'N/A'] // Invalid competing products
  ],
  delimiter: ','
};

// Mock the parseCSVFile function
vi.mock('@/lib/parseCsv', () => ({
  parseCSVFile: vi.fn().mockResolvedValue(mockParseResult)
}));

import { parseMagnetCSV } from '@/lib/parseMagnet';

describe('parseMagnetCSV', () => {
  it('should parse valid Magnet CSV data correctly', async () => {
    const mockFile = new File([''], 'test.csv');
    const result = await parseMagnetCSV(mockFile);
    
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(4); // Should skip empty keyword
    expect(result.data[0]).toEqual({
      keyword: 'dog toys',
      searchVolume: 15000,
      competingProducts: 850,
      rawData: expect.any(Object)
    });
  });

  it('should handle numeric coercion correctly', async () => {
    const mockFile = new File([''], 'test.csv');
    const result = await parseMagnetCSV(mockFile);
    
    // Find the pet supplies entry (invalid volume)
    const petSupplies = result.data.find(row => row.keyword === 'pet supplies');
    expect(petSupplies?.searchVolume).toBe(0); // Should coerce invalid to 0
    expect(petSupplies?.competingProducts).toBe(500);
    
    // Find bird cage entry (N/A competing products)
    const birdCage = result.data.find(row => row.keyword === 'bird cage');
    expect(birdCage?.competingProducts).toBe(0); // Should coerce N/A to 0
  });

  it('should provide warnings for missing columns', async () => {
    // Mock result without volume column
    vi.doMock('@/lib/parseCsv', () => ({
      parseCSVFile: vi.fn().mockResolvedValue({
        headers: ['Keyword', 'Products'],
        rows: [['test keyword', '100']],
        delimiter: ','
      })
    }));

    const { parseMagnetCSV } = await import('@/lib/parseMagnet');
    const mockFile = new File([''], 'test.csv');
    const result = await parseMagnetCSV(mockFile);
    
    expect(result.warnings).toContain('Search volume column not found - volume data will be set to 0');
  });

  it('should fail gracefully when no keyword column found', async () => {
    vi.doMock('@/lib/parseCsv', () => ({
      parseCSVFile: vi.fn().mockResolvedValue({
        headers: ['Volume', 'Products'],
        rows: [['15000', '100']],
        delimiter: ','
      })
    }));

    const { parseMagnetCSV } = await import('@/lib/parseMagnet');
    const mockFile = new File([''], 'test.csv');
    const result = await parseMagnetCSV(mockFile);
    
    expect(result.success).toBe(false);
    expect(result.errors).toContain('Required keyword column not found. Expected columns: keyword, search term, phrase');
  });

  it('should handle case-insensitive header matching', async () => {
    vi.doMock('@/lib/parseCsv', () => ({
      parseCSVFile: vi.fn().mockResolvedValue({
        headers: ['KEYWORD', 'search volume', 'Competing Products'],
        rows: [['test', '1000', '50']],
        delimiter: ','
      })
    }));

    const { parseMagnetCSV } = await import('@/lib/parseMagnet');
    const mockFile = new File([''], 'test.csv');
    const result = await parseMagnetCSV(mockFile);
    
    expect(result.success).toBe(true);
    expect(result.data[0].keyword).toBe('test');
    expect(result.data[0].searchVolume).toBe(1000);
    expect(result.data[0].competingProducts).toBe(50);
  });
});