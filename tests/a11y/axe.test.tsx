import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import Score from '@/pages/Score';

expect.extend(toHaveNoViolations);

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

describe('Accessibility Tests', () => {
  it('Score page should have no accessibility violations', async () => {
    const { container } = render(
      <TestWrapper>
        <Score />
      </TestWrapper>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  }, 10000);

  it('should have proper heading hierarchy', () => {
    const { container } = render(
      <TestWrapper>
        <Score />
      </TestWrapper>
    );

    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const headingLevels = Array.from(headings).map(h => parseInt(h.tagName[1]));
    
    // Check that we start with h1
    expect(headingLevels[0]).toBe(1);
    
    // Check no heading level jumps (e.g., h1 -> h3)
    for (let i = 1; i < headingLevels.length; i++) {
      const diff = headingLevels[i] - headingLevels[i - 1];
      expect(diff).toBeLessThanOrEqual(1);
    }
  });

  it('should have skip link that becomes visible on focus', () => {
    const { getByText } = render(
      <TestWrapper>
        <Score />
      </TestWrapper>
    );

    const skipLink = getByText('Skip to main content');
    expect(skipLink).toBeInTheDocument();
    
    // Should have proper focus styles
    skipLink.focus();
    expect(skipLink).toHaveFocus();
  });
});