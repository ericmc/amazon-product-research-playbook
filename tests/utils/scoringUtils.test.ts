import { describe, it, expect } from 'vitest';
import { computeFinalScore, normalizeValue, checkGates } from '../src/utils/scoringUtils';

describe('Scoring Utils', () => {
  describe('computeFinalScore', () => {
    it('calculates weighted score correctly', () => {
      const criteria = [
        { id: 'revenue', value: 8000, maxValue: 10000, weight: 30 },
        { id: 'demand', value: 1500, maxValue: 2000, weight: 25 },
        { id: 'competition', value: 30, maxValue: 100, weight: 20 }, // inverted
        { id: 'barriers', value: 20, maxValue: 100, weight: 25 }, // inverted
      ];
      
      const result = computeFinalScore(criteria);
      
      // Expected: (80 * 30 + 75 * 25 + 70 * 20 + 80 * 25) / 100 = 76.25 ≈ 76
      expect(result).toBe(76);
    });

    it('handles edge case with all criteria at maximum', () => {
      const criteria = [
        { id: 'revenue', value: 10000, maxValue: 10000, weight: 50 },
        { id: 'competition', value: 0, maxValue: 100, weight: 50 }, // inverted, 0 is best
      ];
      
      const result = computeFinalScore(criteria);
      expect(result).toBe(100);
    });

    it('handles edge case with all criteria at minimum', () => {
      const criteria = [
        { id: 'revenue', value: 0, maxValue: 10000, weight: 50 },
        { id: 'competition', value: 100, maxValue: 100, weight: 50 }, // inverted, 100 is worst
      ];
      
      const result = computeFinalScore(criteria);
      expect(result).toBe(0);
    });
  });

  describe('normalizeValue', () => {
    it('normalizes regular criteria correctly', () => {
      expect(normalizeValue('revenue', 8000, 10000)).toBe(80);
      expect(normalizeValue('demand', 1500, 2000)).toBe(75);
    });

    it('normalizes inverted criteria correctly', () => {
      expect(normalizeValue('competition', 30, 100)).toBe(70);
      expect(normalizeValue('barriers', 20, 100)).toBe(80);
      expect(normalizeValue('seasonality', 40, 100)).toBe(60);
    });
  });

  describe('checkGates', () => {
    it('passes all gates at thresholds', () => {
      const criteria = [
        { id: 'revenue', value: 5000, maxValue: 10000 },
        { id: 'demand', value: 1000, maxValue: 2000 },
        { id: 'competition', value: 70, maxValue: 100 },
      ];
      const margins = { computedMargin: 20 };
      
      const gates = checkGates(criteria, margins);
      
      expect(gates.revenue).toBe(true);
      expect(gates.demand).toBe(true);
      expect(gates.competition).toBe(true);
      expect(gates.margin).toBe(true);
    });

    it('fails gates just below thresholds', () => {
      const criteria = [
        { id: 'revenue', value: 4999, maxValue: 10000 },
        { id: 'demand', value: 999, maxValue: 2000 },
        { id: 'competition', value: 71, maxValue: 100 },
      ];
      const margins = { computedMargin: 19.9 };
      
      const gates = checkGates(criteria, margins);
      
      expect(gates.revenue).toBe(false);
      expect(gates.demand).toBe(false);
      expect(gates.competition).toBe(false);
      expect(gates.margin).toBe(false);
    });

    it('passes gates just above thresholds', () => {
      const criteria = [
        { id: 'revenue', value: 5001, maxValue: 10000 },
        { id: 'demand', value: 1001, maxValue: 2000 },
        { id: 'competition', value: 69, maxValue: 100 },
      ];
      const margins = { computedMargin: 20.1 };
      
      const gates = checkGates(criteria, margins);
      
      expect(gates.revenue).toBe(true);
      expect(gates.demand).toBe(true);
      expect(gates.competition).toBe(true);
      expect(gates.margin).toBe(true);
    });
  });
});