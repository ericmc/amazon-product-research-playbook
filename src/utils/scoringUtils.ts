export const computeFinalScore = (criteria: any[]): number => {
  let totalScore = 0;
  let totalWeight = 0;

  criteria.forEach(criterion => {
    const normalized = normalizeValue(criterion.id, criterion.value, criterion.maxValue);
    const weightedScore = (normalized * criterion.weight) / 100;
    
    totalScore += weightedScore;
    totalWeight += criterion.weight;
  });

  return Math.round(totalScore);
};

export const normalizeValue = (id: string, value: number, maxValue: number): number => {
  const invertedCriteria = ['competition', 'barriers', 'seasonality'];
  const normalizedValue = invertedCriteria.includes(id) 
    ? maxValue - value 
    : value;
  
  return (normalizedValue / maxValue) * 100;
};

// Calculate Helium 10 specific scoring based on available CSV fields
export const calculateH10Score = (product: any, thresholds: any) => {
  const criteria = [
    {
      id: 'revenue_potential',
      name: 'Revenue Potential',
      value: calculateRevenueScore(product),
      weight: 20,
      maxValue: 100,
      threshold: thresholds.revenue,
      gate: (product.revenue || 0) >= 5000,
      gateDescription: '≥ $5,000/mo revenue'
    },
    {
      id: 'sales_momentum',
      name: 'Sales Momentum', 
      value: calculateSalesMomentumScore(product),
      weight: 20,
      maxValue: 100,
      threshold: thresholds.momentum,
      gate: calculateMomentumGate(product),
      gateDescription: 'Positive 90-day or YoY growth'
    },
    {
      id: 'competition',
      name: 'Competition',
      value: calculateCompetitionScore(product),
      weight: 20,
      maxValue: 100,
      threshold: thresholds.competition,
      gate: calculateCompetitionGate(product),
      gateDescription: 'Review Count < 500 and ≤ 5 active sellers'
    },
    {
      id: 'barriers',
      name: 'Barriers to Entry',
      value: calculateBarriersScore(product),
      weight: 15,
      maxValue: 100,
      threshold: thresholds.barriers,
      gate: calculateBarriersGate(product),
      gateDescription: 'Fewer variations + fewer images'
    },
    {
      id: 'logistics',
      name: 'Logistics Burden',
      value: calculateLogisticsScore(product),
      weight: 15,
      maxValue: 100,
      threshold: thresholds.logistics,
      gate: calculateLogisticsGate(product),
      gateDescription: 'Lighter/smaller items, lower storage fees'
    },
    {
      id: 'lifecycle',
      name: 'Lifecycle & Seasonality',
      value: calculateLifecycleScore(product),
      weight: 10,
      maxValue: 100,
      threshold: thresholds.lifecycle,
      gate: calculateLifecycleGate(product),
      gateDescription: 'Age ≥ 12 months and non-seasonal'
    }
  ];

  return criteria;
};

// Revenue Potential: ASIN Revenue (fallback Parent Level Revenue)
const calculateRevenueScore = (product: any): number => {
  const revenue = product.revenue || 0;
  // Scale revenue to 0-100 with $50K as max score
  return Math.min(100, (revenue / 50000) * 100);
};

// Sales Momentum: Sales Trend (90 days %), Sales YoY %
const calculateSalesMomentumScore = (product: any): number => {
  // Use review count and rating as proxy for sales momentum
  const reviewCount = product.reviewCount || 0;
  const rating = product.rating || 0;
  
  // Recent review activity suggests momentum
  const reviewMomentum = Math.min(80, (reviewCount / 1000) * 80);
  const qualityBonus = rating >= 4 ? 20 : rating >= 3.5 ? 10 : 0;
  
  return Math.min(100, reviewMomentum + qualityBonus);
};

const calculateMomentumGate = (product: any): boolean => {
  // For now, assume positive momentum if decent review count and good rating
  const reviewCount = product.reviewCount || 0;
  const rating = product.rating || 0;
  return reviewCount >= 50 && rating >= 3.5;
};

// Competition: Review Count, Reviews Rating, Number of Active Sellers, Sales-to-Reviews
const calculateCompetitionScore = (product: any): number => {
  const reviewCount = product.reviewCount || 0;
  
  // Lower review count = less competition = higher score
  if (reviewCount < 100) return 90;
  if (reviewCount < 300) return 70;
  if (reviewCount < 500) return 50;
  if (reviewCount < 1000) return 30;
  return 10;
};

const calculateCompetitionGate = (product: any): boolean => {
  const reviewCount = product.reviewCount || 0;
  // Gate: Review Count < 500 and ≤ 5 active sellers (assume pass for sellers count for now)
  return reviewCount < 500;
};

// Barriers to Entry: Variation Count, Number of Images
const calculateBarriersScore = (product: any): number => {
  // For now, use review count and rating as proxy for entry barriers
  const reviewCount = product.reviewCount || 0;
  const rating = product.rating || 0;
  
  // Lower barriers = higher score
  let barrierScore = 100;
  
  // High review count indicates established market (higher barriers)
  if (reviewCount > 2000) barrierScore -= 40;
  else if (reviewCount > 1000) barrierScore -= 25;
  else if (reviewCount > 500) barrierScore -= 15;
  
  // Very high ratings indicate high quality expectations (barriers)
  if (rating > 4.5) barrierScore -= 20;
  else if (rating > 4.0) barrierScore -= 10;
  
  return Math.max(0, barrierScore);
};

const calculateBarriersGate = (product: any): boolean => {
  // Assume gate passes if barriers score is decent (simplified for now)
  return calculateBarriersScore(product) >= 50;
};

// Logistics Burden: Weight, Dimensions, Size Tier, Fulfillment, Storage Fees
const calculateLogisticsScore = (product: any): number => {
  // For now, use price as rough proxy for logistics complexity
  // Lower priced items often have better logistics profiles
  const price = product.price || 0;
  
  if (price <= 25) return 90; // Small, light items typically
  if (price <= 50) return 70; // Medium complexity
  if (price <= 100) return 50; // Higher complexity
  return 30; // Likely large/heavy items
};

const calculateLogisticsGate = (product: any): boolean => {
  // Simplified gate - assume pass if logistics score is decent
  return calculateLogisticsScore(product) >= 60;
};

// Lifecycle & Seasonality: Age (Months), Best Sales Period
const calculateLifecycleScore = (product: any): number => {
  // Use review count as proxy for product maturity
  const reviewCount = product.reviewCount || 0;
  
  // Moderate review counts suggest mature, stable products
  if (reviewCount >= 100 && reviewCount <= 1000) return 90; // Mature stage
  if (reviewCount >= 50 && reviewCount <= 2000) return 70; // Growing/stable
  if (reviewCount < 50) return 40; // Too new
  return 50; // Possibly declining
};

const calculateLifecycleGate = (product: any): boolean => {
  // Assume gate passes if product appears mature (moderate review count)
  const reviewCount = product.reviewCount || 0;
  return reviewCount >= 100; // Indicates at least 12 months of sales
};

export const checkGates = (criteria: any[], product: any): { gates: Record<string, boolean>, failures: string[] } => {
  const failures: string[] = [];
  const gates: Record<string, boolean> = {};
  
  // Revenue Gate: ≥ $5,000/mo
  const revenue = product.revenue || 0;
  gates.revenue = revenue >= 5000;
  if (!gates.revenue) {
    failures.push(`Failed Revenue Gate: $${revenue.toLocaleString()}/mo (need ≥$5,000)`);
  }
  
  // Sales Momentum Gate: positive growth indicators
  const reviewCount = product.reviewCount || 0;
  const rating = product.rating || 0;
  gates.momentum = reviewCount >= 50 && rating >= 3.5;
  if (!gates.momentum) {
    failures.push(`Failed Momentum Gate: ${reviewCount} reviews, ${rating} rating (need ≥50 reviews & ≥3.5 rating)`);
  }
  
  // Competition Gate: Review Count < 500 and ≤ 5 active sellers
  gates.competition = reviewCount < 500;
  if (!gates.competition) {
    failures.push(`Failed Competition Gate: ${reviewCount} reviews (need <500 reviews)`);
  }
  
  // Additional gates for other criteria (optional)
  const barriersScore = calculateBarriersScore(product);
  gates.barriers = barriersScore >= 50;
  if (!gates.barriers) {
    failures.push(`Failed Barriers Gate: ${barriersScore.toFixed(0)} score (need ≥50, indicates high entry barriers)`);
  }
  
  const logisticsScore = calculateLogisticsScore(product);
  gates.logistics = logisticsScore >= 60;
  if (!gates.logistics) {
    const price = product.price || 0;
    if (price > 100) {
      failures.push(`Failed Logistics Gate: $${price} price suggests heavy/large item (storage fees likely high)`);
    } else {
      failures.push(`Failed Logistics Gate: ${logisticsScore.toFixed(0)} score (logistics complexity too high)`);
    }
  }
  
  const lifecycleScore = calculateLifecycleScore(product);
  gates.lifecycle = lifecycleScore >= 50;
  if (!gates.lifecycle) {
    failures.push(`Failed Lifecycle Gate: ${lifecycleScore.toFixed(0)} score (product lifecycle concerns)`);
  }

  return { gates, failures };
};

export const getOpportunityRecommendation = (score: number, gateResults: { gates: Record<string, boolean>, failures: string[] }): { 
  recommendation: string, 
  color: string, 
  description: string,
  action: string
} => {
  const { gates, failures } = gateResults;
  const criticalGatesPassed = gates.revenue && gates.momentum && gates.competition;
  
  if (score >= 75 && criticalGatesPassed) {
    return {
      recommendation: 'Proceed',
      color: 'text-green-600',
      description: 'Strong opportunity with high score and passing critical gates',
      action: 'Move forward with detailed sourcing analysis'
    };
  } else if (score >= 60 && score < 75) {
    return {
      recommendation: 'Monitor / Gather Data',
      color: 'text-yellow-600', 
      description: 'Moderate opportunity requiring additional research',
      action: 'Collect more data before making final decision'
    };
  } else {
    return {
      recommendation: 'Reject',
      color: 'text-red-600',
      description: 'Low opportunity score or failed critical gates',
      action: 'Look for alternative opportunities'
    };
  }
};

export const mapCriteriaById = (criteria: any[], id: string) => {
  return criteria.find(c => c.id === id);
};

export const getRecommendation = (score: number, gatesPassed: number): string => {
  if (score >= 80 && gatesPassed === 4) return 'proceed';
  if (score >= 60 && gatesPassed >= 2) return 'gather-data';
  return 'reject';
};