import { SavedOpportunity } from './OpportunityStorage';

export const isStale = (opportunity: SavedOpportunity): boolean => {
  if (!opportunity.lastRefreshedAt) {
    // If never refreshed, consider stale if older than 7 days
    const createdAt = new Date(opportunity.createdAt);
    const now = new Date();
    const daysDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff > 7;
  }
  
  const lastRefreshed = new Date(opportunity.lastRefreshedAt);
  const now = new Date();
  const daysDiff = (now.getTime() - lastRefreshed.getTime()) / (1000 * 60 * 60 * 24);
  return daysDiff > 7;
};

export const getStalenessDays = (opportunity: SavedOpportunity): number => {
  const referenceDate = opportunity.lastRefreshedAt 
    ? new Date(opportunity.lastRefreshedAt)
    : new Date(opportunity.createdAt);
  
  const now = new Date();
  return Math.floor((now.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
};

export const sortOpportunities = (
  opportunities: SavedOpportunity[], 
  sortBy: 'newest' | 'highest-score' | 'stale-first'
): SavedOpportunity[] => {
  const sorted = [...opportunities];
  
  switch (sortBy) {
    case 'newest':
      return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    case 'highest-score':
      return sorted.sort((a, b) => b.finalScore - a.finalScore);
    
    case 'stale-first':
      return sorted.sort((a, b) => {
        const aStale = isStale(a);
        const bStale = isStale(b);
        
        if (aStale && !bStale) return -1;
        if (!aStale && bStale) return 1;
        
        // Both stale or both fresh, sort by staleness days
        return getStalenessDays(b) - getStalenessDays(a);
      });
    
    default:
      return sorted;
  }
};

export const filterStale = (opportunities: SavedOpportunity[]): SavedOpportunity[] => {
  return opportunities.filter(isStale);
};

export const getRefreshHistoryEntries = (opportunity: SavedOpportunity) => {
  return (opportunity.history || []).filter(entry => entry.type === 'refresh');
};

export const getScoreHistory = (opportunity: SavedOpportunity): Array<{ date: string; score: number }> => {
  const history = opportunity.history || [];
  const scoreEntries = history
    .filter(entry => entry.type === 'refresh' && entry.newScore !== undefined)
    .map(entry => ({
      date: entry.date,
      score: entry.newScore!
    }));
  
  // Add initial score
  return [
    { date: opportunity.createdAt, score: opportunity.finalScore },
    ...scoreEntries
  ];
};