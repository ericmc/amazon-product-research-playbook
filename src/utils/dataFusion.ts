/**
 * Multi-source data fusion utilities with provenance tracking
 * Implements weighted median fusion with recency decay and disagreement detection
 */

export type DataSource = 'jungle_scout' | 'helium_10' | 'amazon_poe' | 'manual' | 'validation';

export interface SourcedValue {
  value: number;
  source: DataSource;
  timestamp: string;
  confidence?: number;
  notes?: string;
}

export interface FusedCriterion {
  id: string;
  name: string;
  weight: number;
  fusedValue: number;
  maxValue: number;
  unit: string;
  description: string;
  threshold: number;
  isInverted?: boolean;
  
  // Multi-source data
  bySource: { [key in DataSource]?: SourcedValue };
  fusionMetadata: {
    disagreementIndex: number;
    confidenceScore: number;
    lastFusedAt: string;
    conservativeFusion?: boolean;
    fusionMethod: 'weighted_median' | 'trimmed_mean' | 'single_source';
  };
  
  guidance: {
    overview: string;
    steps: { tool: string; instruction: string; }[];
    tips: string[];
    examples: string[];
  };
}

export interface FusionWeights {
  [criterionId: string]: {
    [source in DataSource]?: number;
  };
}

// Source weights by criterion type
export const FUSION_WEIGHTS: FusionWeights = {
  demand: {
    helium_10: 0.6,
    amazon_poe: 0.4,
    jungle_scout: 0.3,
    manual: 0.1
  },
  revenue: {
    jungle_scout: 0.8,
    amazon_poe: 0.2,
    helium_10: 0.3,
    manual: 0.1
  },
  competition: {
    jungle_scout: 0.7,
    helium_10: 0.3,
    amazon_poe: 0.2,
    manual: 0.1
  },
  seasonality: {
    amazon_poe: 0.6,
    jungle_scout: 0.4,
    helium_10: 0.2,
    manual: 0.1
  },
  margin: {
    validation: 0.9,
    jungle_scout: 0.05,
    helium_10: 0.05,
    manual: 0.1
  },
  barriers: {
    manual: 0.8,
    validation: 0.2
  }
};

/**
 * Calculate recency weight based on data age
 */
export function calculateRecencyWeight(timestamp: string): number {
  const now = new Date();
  const dataDate = new Date(timestamp);
  const daysDiff = Math.floor((now.getTime() - dataDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff <= 30) return 1.0;      // Full weight
  if (daysDiff <= 90) return 0.8;      // 80% weight
  return 0.6;                          // 60% weight for old data
}

/**
 * Calculate disagreement index between source values
 */
export function calculateDisagreementIndex(values: SourcedValue[]): number {
  if (values.length < 2) return 0;
  
  const vals = values.map(v => v.value);
  const mean = vals.reduce((sum, val) => sum + val, 0) / vals.length;
  const variance = vals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / vals.length;
  const stdDev = Math.sqrt(variance);
  
  // Coefficient of variation as disagreement measure
  return mean === 0 ? 0 : (stdDev / Math.abs(mean)) * 100;
}

/**
 * Weighted median calculation
 */
function weightedMedian(values: number[], weights: number[]): number {
  if (values.length === 0) return 0;
  if (values.length === 1) return values[0];
  
  // Create array of {value, weight} pairs and sort by value
  const pairs = values.map((val, i) => ({ value: val, weight: weights[i] }))
    .sort((a, b) => a.value - b.value);
  
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const targetWeight = totalWeight / 2;
  
  let cumulativeWeight = 0;
  for (const pair of pairs) {
    cumulativeWeight += pair.weight;
    if (cumulativeWeight >= targetWeight) {
      return pair.value;
    }
  }
  
  return pairs[pairs.length - 1].value;
}

/**
 * Trimmed mean calculation (fallback)
 */
function trimmedMean(values: number[], trimPercent = 0.2): number {
  if (values.length === 0) return 0;
  if (values.length === 1) return values[0];
  
  const sorted = [...values].sort((a, b) => a - b);
  const trimCount = Math.floor(sorted.length * trimPercent / 2);
  const trimmed = sorted.slice(trimCount, sorted.length - trimCount);
  
  return trimmed.reduce((sum, val) => sum + val, 0) / trimmed.length;
}

/**
 * Main fusion function that combines multiple source values
 */
export function fuseValues(
  criterionId: string,
  sourceValues: { [key in DataSource]?: SourcedValue },
  useConservative = false
): {
  fusedValue: number;
  disagreementIndex: number;
  confidenceScore: number;
  fusionMethod: 'weighted_median' | 'trimmed_mean' | 'single_source';
} {
  const validSources = Object.entries(sourceValues)
    .filter(([_, value]) => value !== undefined) as [DataSource, SourcedValue][];
    
  if (validSources.length === 0) {
    return {
      fusedValue: 0,
      disagreementIndex: 0,
      confidenceScore: 0,
      fusionMethod: 'single_source'
    };
  }
  
  if (validSources.length === 1) {
    return {
      fusedValue: validSources[0][1].value,
      disagreementIndex: 0,
      confidenceScore: validSources[0][1].confidence || 0.8,
      fusionMethod: 'single_source'
    };
  }
  
  const values = validSources.map(([_, sourceValue]) => sourceValue.value);
  const disagreementIndex = calculateDisagreementIndex(validSources.map(([_, sv]) => sv));
  
  // Get weights for this criterion
  const criterionWeights = FUSION_WEIGHTS[criterionId] || {};
  
  // Calculate combined weights (base weight × recency weight)
  const weights = validSources.map(([source, sourceValue]) => {
    const baseWeight = criterionWeights[source] || 0.1;
    const recencyWeight = calculateRecencyWeight(sourceValue.timestamp);
    return baseWeight * recencyWeight;
  });
  
  let fusedValue: number;
  let fusionMethod: 'weighted_median' | 'trimmed_mean' | 'single_source';
  
  try {
    // Use weighted median as primary method
    fusedValue = weightedMedian(values, weights);
    fusionMethod = 'weighted_median';
    
    // For conservative fusion with high disagreement, bias toward more conservative values
    if (useConservative && disagreementIndex > 20) {
      const criterionWeights = FUSION_WEIGHTS[criterionId];
      const isInvertedCriterion = ['competition', 'seasonality'].includes(criterionId);
      
      if (isInvertedCriterion) {
        // For inverted criteria (lower is better), choose higher value for safety
        fusedValue = Math.max(...values);
      } else {
        // For normal criteria, choose lower value for safety
        fusedValue = Math.min(...values);
      }
    }
  } catch (error) {
    // Fallback to trimmed mean
    fusedValue = trimmedMean(values);
    fusionMethod = 'trimmed_mean';
  }
  
  // Calculate confidence based on agreement and data quality
  const maxDisagreement = 50; // Max expected disagreement
  const agreementScore = Math.max(0, (maxDisagreement - disagreementIndex) / maxDisagreement);
  const avgConfidence = validSources.reduce((sum, [_, sv]) => sum + (sv.confidence || 0.8), 0) / validSources.length;
  const confidenceScore = (agreementScore * 0.6) + (avgConfidence * 0.4);
  
  return {
    fusedValue,
    disagreementIndex,
    confidenceScore,
    fusionMethod
  };
}

/**
 * Convert legacy ScoringCriteria to FusedCriterion
 */
export function migrateLegacyCriterion(
  legacyCriterion: any,
  timestamp = new Date().toISOString()
): FusedCriterion {
  const source: DataSource = legacyCriterion.source || 'manual';
  
  const bySource: { [key in DataSource]?: SourcedValue } = {
    [source]: {
      value: legacyCriterion.value,
      source,
      timestamp,
      confidence: 0.8
    }
  };
  
  return {
    id: legacyCriterion.id,
    name: legacyCriterion.name,
    weight: legacyCriterion.weight,
    fusedValue: legacyCriterion.value,
    maxValue: legacyCriterion.maxValue,
    unit: legacyCriterion.unit,
    description: legacyCriterion.description,
    threshold: legacyCriterion.threshold,
    isInverted: legacyCriterion.isInverted,
    bySource,
    fusionMetadata: {
      disagreementIndex: 0,
      confidenceScore: 0.8,
      lastFusedAt: timestamp,
      fusionMethod: 'single_source'
    },
    guidance: legacyCriterion.guidance
  };
}

/**
 * Update a criterion with new source data and re-fuse
 */
export function updateCriterionWithSourceData(
  criterion: FusedCriterion,
  source: DataSource,
  value: number,
  confidence = 0.8,
  notes?: string
): FusedCriterion {
  const timestamp = new Date().toISOString();
  
  // Update source data
  const updatedBySource = {
    ...criterion.bySource,
    [source]: {
      value,
      source,
      timestamp,
      confidence,
      notes
    }
  };
  
  // Re-fuse values
  const fusionResult = fuseValues(criterion.id, updatedBySource);
  
  return {
    ...criterion,
    fusedValue: fusionResult.fusedValue,
    bySource: updatedBySource,
    fusionMetadata: {
      disagreementIndex: fusionResult.disagreementIndex,
      confidenceScore: fusionResult.confidenceScore,
      lastFusedAt: timestamp,
      conservativeFusion: fusionResult.disagreementIndex > 20,
      fusionMethod: fusionResult.fusionMethod
    }
  };
}

/**
 * Batch update multiple criteria with new source data
 */
export function batchUpdateCriteria(
  criteria: FusedCriterion[],
  sourceData: { [criterionId: string]: { value: number; confidence?: number; notes?: string } },
  source: DataSource
): FusedCriterion[] {
  return criteria.map(criterion => {
    const newData = sourceData[criterion.id];
    if (newData) {
      return updateCriterionWithSourceData(
        criterion,
        source,
        newData.value,
        newData.confidence,
        newData.notes
      );
    }
    return criterion;
  });
}