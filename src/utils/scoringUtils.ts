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
      weight: 25,
      maxValue: 100,
      threshold: thresholds.revenue
    },
    {
      id: 'sales_momentum',
      name: 'Sales Momentum', 
      value: calculateSalesMomentumScore(product),
      weight: 20,
      maxValue: 100,
      threshold: thresholds.momentum
    },
    {
      id: 'competition',
      name: 'Competition',
      value: calculateCompetitionScore(product),
      weight: 20,
      maxValue: 100,
      threshold: thresholds.competition
    },
    {
      id: 'price_signals',
      name: 'Price Signals',
      value: calculatePriceSignalsScore(product),
      weight: 15,
      maxValue: 100,
      threshold: thresholds.priceSignals
    },
    {
      id: 'barriers',
      name: 'Barriers to Entry',
      value: calculateBarriersScore(product),
      weight: 10,
      maxValue: 100,
      threshold: thresholds.barriers
    },
    {
      id: 'logistics',
      name: 'Logistics Burden',
      value: calculateLogisticsScore(product),
      weight: 5,
      maxValue: 100,
      threshold: thresholds.logistics
    },
    {
      id: 'lifecycle',
      name: 'Lifecycle & Seasonality',
      value: calculateLifecycleScore(product),
      weight: 5,
      maxValue: 100,
      threshold: thresholds.lifecycle
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
  // For now, use review count as proxy for sales momentum until we have sales trend data
  // Higher review velocity suggests better sales momentum
  const reviewCount = product.reviewCount || 0;
  const rating = product.rating || 0;
  
  // High review count with good rating = good momentum
  const reviewMomentum = Math.min(100, (reviewCount / 2000) * 100);
  const qualityFactor = rating > 4 ? 1.2 : rating > 3.5 ? 1.0 : 0.8;
  
  return Math.min(100, reviewMomentum * qualityFactor);
};

// Competition: Review Count, Reviews Rating, Number of Active Sellers, Sales-to-Reviews
const calculateCompetitionScore = (product: any): number => {
  const reviewCount = product.reviewCount || 0;
  const rating = product.rating || 0;
  
  // Higher review count = more established competition (worse for entry)
  const competitionDensity = Math.min(100, (reviewCount / 5000) * 100);
  
  // High ratings across competition = harder to compete
  const qualityCompetition = rating > 4.5 ? 90 : rating > 4 ? 70 : rating > 3.5 ? 50 : 30;
  
  // Return inverted score (lower competition = higher score)
  const totalCompetition = (competitionDensity + qualityCompetition) / 2;
  return Math.max(0, 100 - totalCompetition);
};

// Price Signals: Price, Price Trend (90d %)
const calculatePriceSignalsScore = (product: any): number => {
  const price = product.price || 0;
  
  // Optimal price range is $15-$75 for good margins and accessibility
  let priceScore = 0;
  if (price >= 15 && price <= 75) {
    priceScore = 100;
  } else if (price >= 10 && price <= 100) {
    priceScore = 70;
  } else if (price >= 5 && price <= 150) {
    priceScore = 40;
  } else {
    priceScore = 20;
  }
  
  return priceScore;
};

// Barriers to Entry: Variation Count, Number of Images
const calculateBarriersScore = (product: any): number => {
  const reviewCount = product.reviewCount || 0;
  const rating = product.rating || 0;
  
  // High review count = established market with barriers
  const reviewBarrier = Math.min(80, (reviewCount / 3000) * 80);
  
  // Very high ratings = high quality expectations (barrier)
  const qualityBarrier = rating > 4.5 ? 30 : rating > 4 ? 20 : 10;
  
  // Return inverted score (lower barriers = higher score for entry)
  const totalBarriers = reviewBarrier + qualityBarrier;
  return Math.max(0, 100 - totalBarriers);
};

// Logistics Burden: Weight, Dimensions, Size Tier, Fulfillment, Storage Fees
const calculateLogisticsScore = (product: any): number => {
  // For now, all products get neutral score since we don't have logistics data
  // TODO: Implement when size tier, weight, fulfillment data is available
  return 70;
};

// Lifecycle & Seasonality: Age (Months), Best Sales Period
const calculateLifecycleScore = (product: any): number => {
  // For now, use price as proxy for lifecycle maturity
  // Mid-range prices often indicate mature, stable products
  const price = product.price || 0;
  
  if (price >= 20 && price <= 60) return 80; // Mature market
  if (price >= 10 && price <= 100) return 60; // Growing/declining
  return 40; // Early/late lifecycle
};

export const checkGates = (criteria: any[], margins?: { computedMargin?: number }): Record<string, boolean> => {
  const getCriteriaValue = (id: string) => {
    const criterion = criteria.find(c => c.id === id);
    return criterion?.value || 0;
  };

  return {
    revenue: getCriteriaValue('revenue_potential') >= 40,
    momentum: getCriteriaValue('sales_momentum') >= 50,
    competition: getCriteriaValue('competition') >= 60,
    barriers: getCriteriaValue('barriers') >= 50
  };
};

export const mapCriteriaById = (criteria: any[], id: string) => {
  return criteria.find(c => c.id === id);
};

export const getRecommendation = (score: number, gatesPassed: number): string => {
  if (score >= 80 && gatesPassed === 4) return 'proceed';
  if (score >= 60 && gatesPassed >= 2) return 'gather-data';
  return 'reject';
};