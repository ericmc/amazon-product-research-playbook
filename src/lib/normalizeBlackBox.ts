import { ParsedData } from './parseCsv';

export interface ProductData {
  asin: string;
  title: string;
  brand: string;
  keyword: string;
  searchVolume: number;
  revenue: number;
  unitsSold: number;
  price: number;
  competition: string;
  dimensions?: string;
  weight?: string;
  rating?: number;
  reviewCount?: number;
  competingProducts?: number;
}

export interface AutoMappedProduct {
  productData: ProductData;
  rawData: Record<string, string>;
  metadata: Record<string, string>;
}

/**
 * Auto-mapping for Helium 10 Black Box CSV headers
 * Case-insensitive with synonyms support
 */
export const helium10BlackBoxAutoMap = (headers: string[]): Record<string, string> => {
  const mapping: Record<string, string> = {};
  
  headers.forEach(header => {
    const lowerHeader = header.toLowerCase().trim();
    
    // Core Black Box fields - exact matches and synonyms
    if (lowerHeader === 'asin') mapping['asin'] = header;
    else if (lowerHeader === 'title') mapping['title'] = header;
    else if (lowerHeader === 'brand') mapping['brand'] = header;
    else if (lowerHeader === 'url') mapping['url'] = header;
    else if (lowerHeader === 'image url') mapping['imageUrl'] = header;
    else if (lowerHeader === 'category') mapping['category'] = header;
    
    // BSR variations
    else if (lowerHeader === 'best seller rank' || lowerHeader === 'bsr' || lowerHeader === 'category bsr') 
      mapping['bsr'] = header;
    
    else if (lowerHeader === 'fulfillment') mapping['fulfillment'] = header;
    else if (lowerHeader === 'price') mapping['price'] = header;
    
    // Revenue variations
    else if (lowerHeader === 'asin revenue') mapping['revenue'] = header;
    else if (lowerHeader === 'parent level revenue') mapping['parentRevenue'] = header;
    
    // Review variations
    else if (lowerHeader === 'reviews' || lowerHeader === 'review count') mapping['reviewCount'] = header;
    else if (lowerHeader === 'reviews rating' || lowerHeader === 'rating') mapping['rating'] = header;
    
    // Weight variations
    else if (lowerHeader === 'weight' || lowerHeader === 'weight (lb)') mapping['weight'] = header;
    
    // Dimension fields
    else if (lowerHeader === 'length') mapping['length'] = header;
    else if (lowerHeader === 'width') mapping['width'] = header;
    else if (lowerHeader === 'height') mapping['height'] = header;
    
    // Optional Magnet/Cerebro fields for backfill
    else if (lowerHeader.includes('search volume')) mapping['searchVolume'] = header;
    else if (lowerHeader.includes('competing products') || lowerHeader.includes('competitors')) 
      mapping['competingProducts'] = header;
    else if (lowerHeader.includes('units sold') || lowerHeader.includes('monthly units')) 
      mapping['unitsSold'] = header;
    else if (lowerHeader.includes('keyword') && !mapping['keyword']) mapping['keyword'] = header;
    else if (lowerHeader.includes('competition') && !mapping['competition']) mapping['competition'] = header;
  });
  
  return mapping;
};

/**
 * Normalize string values to numbers, handling various formats
 */
export const normalizeValue = (value: string): number => {
  if (!value || typeof value !== 'string') return 0;
  
  // Trim whitespace
  const trimmed = value.trim();
  if (!trimmed) return 0;
  
  // Remove common prefixes and formatting
  let cleaned = trimmed.replace(/[$,\s%]/g, '');
  
  // Handle different number formats
  if (cleaned.includes('K') || cleaned.includes('k')) {
    cleaned = cleaned.replace(/[Kk]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed * 1000;
  }
  if (cleaned.includes('M') || cleaned.includes('m')) {
    cleaned = cleaned.replace(/[Mm]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed * 1000000;
  }
  
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Normalize competition text to numeric values
 */
export const normalizeCompetition = (competition: string): number => {
  const lower = competition?.toLowerCase().trim();
  switch (lower) {
    case 'low': return 25;
    case 'medium': return 50;
    case 'high': return 75;
    default: return parseFloat(competition) || 50;
  }
};

/**
 * Build dimensions string from individual dimension fields
 */
export const buildDimensions = (rawData: Record<string, string>, mapping: Record<string, string>): string => {
  // Build dimensions from Length x Width x Height, skip missing parts gracefully
  if (mapping.length || mapping.width || mapping.height) {
    const length = rawData[mapping.length || '']?.trim();
    const width = rawData[mapping.width || '']?.trim();
    const height = rawData[mapping.height || '']?.trim();
    
    // Only include non-empty dimension parts
    const validParts = [length, width, height].filter(part => part && part.length > 0);
    if (validParts.length > 0) {
      return validParts.join(' x ');
    }
  }
  
  // If no dimensions available, return "N/A"
  return "N/A";
};

/**
 * Process Black Box CSV data with auto-mapping and normalization
 */
export const processBlackBoxData = (data: ParsedData): {products: AutoMappedProduct[], revenueSource: string} => {
  const mapping = helium10BlackBoxAutoMap(data.headers);
  
  // Determine revenue source used
  let revenueSource = 'N/A';
  if (mapping.revenue) revenueSource = 'ASIN Revenue';
  else if (mapping.parentRevenue) revenueSource = 'Parent Level Revenue';
  
  const products = data.rows.map(row => {
    const rawData: Record<string, string> = {};
    data.headers.forEach((header, index) => {
      rawData[header] = row[index] || '';
    });

    const productData: ProductData = {
      asin: (rawData[mapping.asin] || '').trim(),
      title: (rawData[mapping.title] || '').trim(),
      brand: (rawData[mapping.brand] || '').trim(),
      keyword: (rawData[mapping.title] || '').trim(), // Use title as keyword for now
      searchVolume: 0, // Leave blank for now
      revenue: normalizeValue(rawData[mapping.revenue] || rawData[mapping.parentRevenue] || '0'),
      unitsSold: 0, // Leave blank for now
      price: normalizeValue(rawData[mapping.price] || '0'),
      competition: '', // Leave blank for now
      dimensions: buildDimensions(rawData, mapping),
      weight: (rawData[mapping.weight] || '').trim(),
      rating: normalizeValue(rawData[mapping.rating] || '0'),
      reviewCount: normalizeValue(rawData[mapping.reviewCount] || '0'),
      competingProducts: 0 // Leave blank for now
    };

    // Store metadata for detail views - sanitize all values
    const metadata = {
      asin: (rawData[mapping.asin] || '').trim(),
      brand: (rawData[mapping.brand] || '').trim(),
      url: (rawData[mapping.url] || '').trim(),
      imageUrl: (rawData[mapping.imageUrl] || '').trim(),
      category: (rawData[mapping.category] || '').trim(),
      bsr: (rawData[mapping.bsr] || '').trim(),
      fulfillment: (rawData[mapping.fulfillment] || '').trim()
    };

    return { productData, rawData, metadata };
  });

  return { products, revenueSource };
};