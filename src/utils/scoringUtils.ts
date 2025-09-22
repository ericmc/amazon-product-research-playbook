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

export const checkGates = (criteria: any[], margins?: { computedMargin?: number }): Record<string, boolean> => {
  const getCriteriaValue = (id: string) => {
    const criterion = criteria.find(c => c.id === id);
    return criterion?.value || 0;
  };

  return {
    revenue: getCriteriaValue('revenue') >= 5000,
    demand: getCriteriaValue('demand') >= 1000,
    competition: getCriteriaValue('competition') <= 70,
    margin: (margins?.computedMargin || 0) >= 20
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