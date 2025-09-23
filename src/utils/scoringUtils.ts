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

// Calculate Helium 10 specific scoring based on available fields
export const calculateH10Score = (product: any, thresholds: any) => {
  const criteria = [
    {
      id: 'revenue',
      name: 'Revenue Potential',
      value: product.revenue || 0,
      weight: 25,
      maxValue: 50000,
      threshold: thresholds.revenue
    },
    {
      id: 'demand',
      name: 'Demand Growth', 
      value: calculateDemandScore(product),
      weight: 20,
      maxValue: 100,
      threshold: thresholds.demand
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
      id: 'price_value',
      name: 'Price/Value',
      value: calculatePriceValueScore(product),
      weight: 15,
      maxValue: 100,
      threshold: thresholds.priceValue
    },
    {
      id: 'barriers',
      name: 'Barriers',
      value: calculateBarriersScore(product),
      weight: 10,
      maxValue: 100,
      threshold: thresholds.barriers
    },
    {
      id: 'logistics',
      name: 'Logistics',
      value: calculateLogisticsScore(product),
      weight: 10,
      maxValue: 100,
      threshold: thresholds.logistics
    }
  ];

  return criteria;
};

// Helper functions for each scoring criteria
const calculateDemandScore = (product: any): number => {
  // For now, use review count as proxy for demand until we have sales trend data
  const reviewCount = product.reviewCount || 0;
  return Math.min(100, (reviewCount / 1000) * 100);
};

const calculateCompetitionScore = (product: any): number => {
  // Higher review count = more competition (inverted)
  // Lower rating = less quality competition
  const reviewCount = product.reviewCount || 0;
  const rating = product.rating || 0;
  
  const competitionFromReviews = Math.min(100, (reviewCount / 5000) * 100);
  const qualityCompetition = rating * 20; // Scale 0-5 to 0-100
  
  return Math.min(100, (competitionFromReviews + qualityCompetition) / 2);
};

const calculatePriceValueScore = (product: any): number => {
  // Price between $15-$50 gets highest score
  // Rating contributes to value perception
  const price = product.price || 0;
  const rating = product.rating || 0;
  
  let priceScore = 0;
  if (price >= 15 && price <= 50) priceScore = 100;
  else if (price >= 10 && price <= 75) priceScore = 70;
  else if (price >= 5) priceScore = 40;
  
  const ratingScore = rating * 20; // Scale 0-5 to 0-100
  
  return Math.min(100, (priceScore * 0.7) + (ratingScore * 0.3));
};

const calculateBarriersScore = (product: any): number => {
  // Lower barriers = higher score (easier to enter market)
  // High review count = high barriers (inverted)
  const reviewCount = product.reviewCount || 0;
  const rating = product.rating || 0;
  
  // Very high review count indicates established market (higher barriers)
  const reviewBarrier = Math.min(100, (reviewCount / 2000) * 100);
  // High rating indicates quality expectations (higher barriers)  
  const qualityBarrier = rating * 15;
  
  const totalBarriers = Math.min(100, reviewBarrier + qualityBarrier);
  return Math.max(0, 100 - totalBarriers); // Invert - lower barriers = higher score
};

const calculateLogisticsScore = (product: any): number => {
  // For now, give all products a neutral logistics score
  // TODO: Implement when size tier, weight, storage fees data is available
  return 70;
};

export const checkGates = (criteria: any[], margins?: { computedMargin?: number }): Record<string, boolean> => {
  const getCriteriaValue = (id: string) => {
    const criterion = criteria.find(c => c.id === id);
    return criterion?.value || 0;
  };

  return {
    revenue: getCriteriaValue('revenue') >= 5000,
    demand: getCriteriaValue('demand') >= 30,
    competition: getCriteriaValue('competition') <= 70,
    barriers: getCriteriaValue('barriers') >= 40
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