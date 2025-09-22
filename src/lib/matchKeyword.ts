/**
 * Suggest primary keywords for products based on Magnet data
 */

import { AutoMappedProduct } from './normalizeBlackBox';
import { MagnetRow } from './parseMagnet';
import { KeywordIndex, findKeywordMatches, buildKeywordIndex } from './keywordIndex';

export interface KeywordSuggestion {
  keyword: string;
  searchVolume: number;
  competingProducts: number;
  confidence: number; // 0-1 score indicating match quality
}

export interface ProductWithKeywords extends AutoMappedProduct {
  suggestedKeywords?: KeywordSuggestion[];
  primaryKeyword?: string;
  searchVolume?: number;
  competingProducts?: number;
}

/**
 * Get the best primary keyword suggestion for a product
 */
export function suggestPrimaryKeyword(
  productName: string,
  keywordIndex: KeywordIndex
): KeywordSuggestion | null {
  const matches = findKeywordMatches(productName, keywordIndex, 5);
  
  if (matches.length === 0) return null;
  
  // The top match becomes the primary keyword suggestion
  const topMatch = matches[0];
  
  return {
    keyword: topMatch.keyword,
    searchVolume: topMatch.searchVolume,
    competingProducts: topMatch.competingProducts,
    confidence: topMatch.score
  };
}

/**
 * Enrich products with keyword suggestions from Magnet data
 */
export function enrichProductsWithKeywords(
  products: AutoMappedProduct[],
  magnetRows: MagnetRow[]
): { enrichedProducts: ProductWithKeywords[], stats: { enriched: number, total: number } } {
  const keywordIndex = buildKeywordIndex(magnetRows);
  const enrichedProducts: ProductWithKeywords[] = [];
  let enrichedCount = 0;
  
  for (const product of products) {
    const productName = product.productData.title || '';
    
    if (!productName.trim()) {
      enrichedProducts.push(product);
      continue;
    }
    
    const suggestion = suggestPrimaryKeyword(productName, keywordIndex);
    const allMatches = findKeywordMatches(productName, keywordIndex, 10);
    
    const enrichedProduct: ProductWithKeywords = {
      ...product,
      suggestedKeywords: allMatches.map(m => ({
        keyword: m.keyword,
        searchVolume: m.searchVolume,
        competingProducts: m.competingProducts,
        confidence: m.score
      }))
    };
    
    if (suggestion && suggestion.confidence > 0.2) {
      enrichedProduct.primaryKeyword = suggestion.keyword;
      enrichedProduct.searchVolume = suggestion.searchVolume;
      enrichedProduct.competingProducts = suggestion.competingProducts;
      
      // Update product data with search volume if available
      if (suggestion.searchVolume > 0) {
        enrichedProduct.productData.searchVolume = Math.max(
          enrichedProduct.productData.searchVolume || 0,
          suggestion.searchVolume
        );
      }
      
      enrichedCount++;
    }
    
    enrichedProducts.push(enrichedProduct);
  }
  
  return {
    enrichedProducts,
    stats: {
      enriched: enrichedCount,
      total: products.length
    }
  };
}