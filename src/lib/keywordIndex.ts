/**
 * Build keyword index for efficient matching and scoring
 */

import { MagnetRow } from './parseMagnet';

export interface KeywordIndex {
  [key: string]: MagnetRow[];
}

export interface KeywordMetrics {
  keyword: string;
  searchVolume: number;
  competingProducts: number;
  score: number;
}

/**
 * Normalize text for keyword matching
 */
function normalizeKeyword(text: string): string {
  return text.toLowerCase().trim().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');
}

/**
 * Extract searchable tokens from text
 */
function extractTokens(text: string): string[] {
  const normalized = normalizeKeyword(text);
  const words = normalized.split(' ').filter(w => w.length > 2); // Skip short words
  
  // Generate combinations of adjacent words
  const tokens = [...words];
  for (let i = 0; i < words.length - 1; i++) {
    tokens.push(`${words[i]} ${words[i + 1]}`);
    if (i < words.length - 2) {
      tokens.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
    }
  }
  
  return [...new Set(tokens)]; // Remove duplicates
}

/**
 * Build an index of keywords for fast lookups
 */
export function buildKeywordIndex(magnetRows: MagnetRow[]): KeywordIndex {
  const index: KeywordIndex = {};
  
  for (const row of magnetRows) {
    const tokens = extractTokens(row.keyword);
    
    for (const token of tokens) {
      if (!index[token]) {
        index[token] = [];
      }
      index[token].push(row);
    }
  }
  
  return index;
}

/**
 * Calculate relevance score for a keyword match
 */
function calculateScore(productName: string, keyword: string, searchVolume: number): number {
  const productTokens = extractTokens(productName);
  const keywordTokens = extractTokens(keyword);
  
  // Token overlap score (0-1)
  const overlap = keywordTokens.filter(kt => 
    productTokens.some(pt => pt.includes(kt) || kt.includes(pt))
  ).length;
  const overlapScore = overlap / Math.max(keywordTokens.length, 1);
  
  // Volume score (logarithmic scaling)
  const volumeScore = Math.log10(Math.max(searchVolume, 1)) / 6; // Normalize to ~0-1
  
  // Length penalty (prefer shorter, more specific keywords)
  const lengthPenalty = Math.max(0, 1 - (keyword.length / 50));
  
  return (overlapScore * 0.6) + (volumeScore * 0.3) + (lengthPenalty * 0.1);
}

/**
 * Find best keyword matches for a product
 */
export function findKeywordMatches(
  productName: string, 
  keywordIndex: KeywordIndex,
  maxResults: number = 10
): KeywordMetrics[] {
  const productTokens = extractTokens(productName);
  const candidates = new Map<string, MagnetRow>();
  
  // Collect all candidate keywords
  for (const token of productTokens) {
    const matches = keywordIndex[token] || [];
    for (const match of matches) {
      candidates.set(match.keyword, match);
    }
  }
  
  // Score and rank candidates
  const scored: KeywordMetrics[] = Array.from(candidates.values()).map(row => ({
    keyword: row.keyword,
    searchVolume: row.searchVolume,
    competingProducts: row.competingProducts,
    score: calculateScore(productName, row.keyword, row.searchVolume)
  }));
  
  // Sort by score (descending) and return top results
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .filter(m => m.score > 0.1); // Filter out very low scores
}