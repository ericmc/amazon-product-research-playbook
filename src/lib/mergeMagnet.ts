/**
 * Merge Magnet/Cerebro data with Black Box products
 */

import { AutoMappedProduct } from './normalizeBlackBox';
import { MagnetRow } from './parseMagnet';
import { enrichProductsWithKeywords, ProductWithKeywords } from './matchKeyword';

export interface MagnetMergeResult {
  products: ProductWithKeywords[];
  summary: {
    totalProducts: number;
    enrichedCount: number;
    keywordsProcessed: number;
    averageSearchVolume: number;
  };
}

/**
 * Merge Magnet data with existing Black Box products
 */
export function mergeMagnetWithProducts(
  blackBoxProducts: AutoMappedProduct[],
  magnetRows: MagnetRow[]
): MagnetMergeResult {
  const { enrichedProducts, stats } = enrichProductsWithKeywords(blackBoxProducts, magnetRows);
  
  // Calculate summary statistics
  const enrichedWithVolume = enrichedProducts.filter(p => p.searchVolume && p.searchVolume > 0);
  const totalSearchVolume = enrichedWithVolume.reduce((sum, p) => sum + (p.searchVolume || 0), 0);
  const averageSearchVolume = enrichedWithVolume.length > 0 
    ? Math.round(totalSearchVolume / enrichedWithVolume.length)
    : 0;
  
  return {
    products: enrichedProducts,
    summary: {
      totalProducts: blackBoxProducts.length,
      enrichedCount: stats.enriched,
      keywordsProcessed: magnetRows.length,
      averageSearchVolume
    }
  };
}

/**
 * Validate Magnet CSV data before processing
 */
export function validateMagnetData(magnetRows: MagnetRow[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (magnetRows.length === 0) {
    errors.push('No valid keywords found in CSV');
    return { isValid: false, errors, warnings };
  }
  
  const withVolume = magnetRows.filter(r => r.searchVolume > 0);
  if (withVolume.length === 0) {
    warnings.push('No search volume data found in any keywords');
  }
  
  const withProducts = magnetRows.filter(r => r.competingProducts > 0);
  if (withProducts.length === 0) {
    warnings.push('No competing products data found in any keywords');
  }
  
  if (magnetRows.length < 10) {
    warnings.push(`Only ${magnetRows.length} keywords found - consider using a larger dataset for better matching`);
  }
  
  return {
    isValid: true,
    errors,
    warnings
  };
}