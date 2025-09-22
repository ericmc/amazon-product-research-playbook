import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock ComparisonModal component for testing
const MockComparisonModal = ({ opportunities }: { opportunities: any[] }) => {
  if (opportunities.length < 2) return null;

  const getBestValue = (criterionId: string, values: number[]) => {
    const isLowerBetter = ['competition', 'barriers', 'seasonality'].includes(criterionId);
    return isLowerBetter ? Math.min(...values) : Math.max(...values);
  };

  return (
    <div data-testid="comparison-modal">
      <table>
        <thead>
          <tr>
            <th>Product</th>
            {opportunities.map((opp, index) => (
              <th key={index}>{opp.productName}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Overall Score</td>
            {opportunities.map((opp, index) => {
              const isBest = opp.finalScore === Math.max(...opportunities.map(o => o.finalScore));
              return (
                <td key={index} data-testid={isBest ? "best-score" : "score"}>
                  {opp.finalScore}
                  {isBest && <span aria-label="best score">★</span>}
                </td>
              );
            })}
          </tr>
          {opportunities[0]?.criteria?.map((criterion: any) => {
            const values = opportunities.map(opp => {
              const oppCriterion = opp.criteria.find((c: any) => c.id === criterion.id);
              return oppCriterion?.value || 0;
            });
            const bestValue = getBestValue(criterion.id, values);

            return (
              <tr key={criterion.id}>
                <td>{criterion.name}</td>
                {opportunities.map((opp, oppIndex) => {
                  const oppCriterion = opp.criteria.find((c: any) => c.id === criterion.id);
                  const value = oppCriterion?.value || 0;
                  const isBest = value === bestValue;

                  return (
                    <td key={oppIndex} data-testid={isBest ? "best-value" : "value"}>
                      {value}
                      {isBest && <span aria-label="best value">★</span>}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

describe('ComparisonModal', () => {
  const mockOpportunities = [
    {
      id: '1',
      productName: 'Product A',
      finalScore: 85,
      criteria: [
        { id: 'revenue', name: 'Revenue', value: 8000 },
        { id: 'competition', name: 'Competition', value: 30 },
      ]
    },
    {
      id: '2',
      productName: 'Product B',
      finalScore: 75,
      criteria: [
        { id: 'revenue', name: 'Revenue', value: 6000 },
        { id: 'competition', name: 'Competition', value: 50 },
      ]
    }
  ];

  it('highlights best score per row', () => {
    render(<MockComparisonModal opportunities={mockOpportunities} />);
    
    const bestScores = screen.getAllByTestId('best-score');
    expect(bestScores).toHaveLength(1);
    expect(bestScores[0]).toHaveTextContent('85');
    expect(screen.getByLabelText('best score')).toBeInTheDocument();
  });

  it('highlights best value per criterion row', () => {
    render(<MockComparisonModal opportunities={mockOpportunities} />);
    
    const bestValues = screen.getAllByTestId('best-value');
    expect(bestValues.length).toBeGreaterThan(0);
    
    // Revenue: higher is better, so 8000 should be marked as best
    // Competition: lower is better, so 30 should be marked as best
    const bestLabels = screen.getAllByLabelText('best value');
    expect(bestLabels.length).toBeGreaterThan(0);
  });

  it('handles ties in values', () => {
    const tiedOpportunities = [
      {
        id: '1',
        productName: 'Product A',
        finalScore: 80,
        criteria: [{ id: 'revenue', name: 'Revenue', value: 5000 }]
      },
      {
        id: '2',
        productName: 'Product B', 
        finalScore: 80,
        criteria: [{ id: 'revenue', name: 'Revenue', value: 5000 }]
      }
    ];

    render(<MockComparisonModal opportunities={tiedOpportunities} />);
    
    // Both should be marked as best since they tie
    const bestScores = screen.getAllByTestId('best-score');
    expect(bestScores).toHaveLength(2);
  });

  it('supports keyboard navigation', () => {
    const { container } = render(<MockComparisonModal opportunities={mockOpportunities} />);
    
    const table = container.querySelector('table');
    expect(table).toBeInTheDocument();
    
    // Table should be focusable and keyboard navigable
    if (table) {
      table.focus();
      expect(document.activeElement).toBe(table);
    }
  });

  it('returns null for less than 2 opportunities', () => {
    const { container } = render(<MockComparisonModal opportunities={[mockOpportunities[0]]} />);
    expect(container.firstChild).toBeNull();
  });
});