import { ParsedData } from './parseCsv';
import { normalizeValue, normalizeCompetition } from './normalizeBlackBox';

export interface MagnetData {
  keyword: string;
  searchVolume: number;
  competition: string;
  competingProducts: number;
  cpc?: number;
  seasonality?: string;
}

export interface AutoMappedMagnet {
  magnetData: MagnetData;
  rawData: Record<string, string>;
  metadata: Record<string, string>;
}

/**
 * Auto-mapping for Helium 10 Magnet/Cerebro CSV headers
 */
export const helium10MagnetAutoMap = (headers: string[]): Record<string, string> => {
  const mapping: Record<string, string> = {};
  
  headers.forEach(header => {
    const lowerHeader = header.toLowerCase().trim();
    
    // Core Magnet/Cerebro fields
    if (lowerHeader === 'keyword' || lowerHeader === 'search term') mapping['keyword'] = header;
    else if (lowerHeader === 'search volume' || lowerHeader === 'monthly search volume') mapping['searchVolume'] = header;
    else if (lowerHeader === 'competition' || lowerHeader === 'competition level') mapping['competition'] = header;
    else if (lowerHeader === 'competing products' || lowerHeader === 'competitors' || lowerHeader === 'num competitors') mapping['competingProducts'] = header;
    else if (lowerHeader === 'cpc' || lowerHeader === 'cost per click') mapping['cpc'] = header;
    else if (lowerHeader === 'seasonality' || lowerHeader === 'trend') mapping['seasonality'] = header;
    
    // Additional metadata fields
    else if (lowerHeader === 'asin' || lowerHeader === 'product asin') mapping['asin'] = header;
    else if (lowerHeader === 'title' || lowerHeader === 'product title') mapping['title'] = header;
    else if (lowerHeader === 'brand') mapping['brand'] = header;
    else if (lowerHeader === 'rank' || lowerHeader === 'keyword rank') mapping['rank'] = header;
    else if (lowerHeader === 'relevancy' || lowerHeader === 'relevancy score') mapping['relevancy'] = header;
  });
  
  return mapping;
};

/**
 * Process Magnet/Cerebro CSV data with auto-mapping and normalization
 */
export const processMagnetData = (data: ParsedData): {keywords: AutoMappedMagnet[], source: string} => {
  const mapping = helium10MagnetAutoMap(data.headers);
  
  // Determine source type
  const source = mapping.asin ? 'cerebro' : 'magnet';
  
  const keywords = data.rows.map(row => {
    const rawData: Record<string, string> = {};
    data.headers.forEach((header, index) => {
      rawData[header] = row[index] || '';
    });

    const magnetData: MagnetData = {
      keyword: (rawData[mapping.keyword] || '').trim(),
      searchVolume: normalizeValue(rawData[mapping.searchVolume] || '0'),
      competition: (rawData[mapping.competition] || '').trim(),
      competingProducts: normalizeValue(rawData[mapping.competingProducts] || '0'),
      cpc: normalizeValue(rawData[mapping.cpc] || '0'),
      seasonality: (rawData[mapping.seasonality] || '').trim()
    };

    // Store metadata for detail views
    const metadata = {
      asin: (rawData[mapping.asin] || '').trim(),
      title: (rawData[mapping.title] || '').trim(),
      brand: (rawData[mapping.brand] || '').trim(),
      rank: (rawData[mapping.rank] || '').trim(),
      relevancy: (rawData[mapping.relevancy] || '').trim(),
      source: source
    };

    return { magnetData, rawData, metadata };
  });

  return { keywords, source };
};

/**
 * Backfill Black Box products with Magnet data by keyword matching
 */
export const backfillWithMagnetData = (
  blackBoxProducts: any[],
  magnetKeywords: AutoMappedMagnet[]
): any[] => {
  return blackBoxProducts.map(product => {
    // Find matching keyword data (flexible matching)
    const matchingKeyword = magnetKeywords.find(magnet => {
      const productKeyword = product.productData.keyword.toLowerCase();
      const magnetKeyword = magnet.magnetData.keyword.toLowerCase();
      
      // Try exact match first, then partial match
      return magnetKeyword === productKeyword || 
             magnetKeyword.includes(productKeyword) || 
             productKeyword.includes(magnetKeyword);
    });

    if (matchingKeyword) {
      return {
        ...product,
        productData: {
          ...product.productData,
          searchVolume: matchingKeyword.magnetData.searchVolume,
          competingProducts: matchingKeyword.magnetData.competingProducts,
          competition: matchingKeyword.magnetData.competition
        },
        metadata: {
          ...product.metadata,
          magnetSource: matchingKeyword.metadata.source,
          magnetKeyword: matchingKeyword.magnetData.keyword
        }
      };
    }

    return product;
  });
};