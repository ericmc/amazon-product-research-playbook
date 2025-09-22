import { test, expect } from '@playwright/test';

test.describe('Amazon Product Research Playbook E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Setup localStorage with test data
    await page.addInitScript(() => {
      const testOpportunity = {
        id: 'test-123',
        productName: 'Test Widget',
        finalScore: 75,
        criteria: [
          { id: 'revenue', name: 'Revenue', value: 6000, maxValue: 10000, weight: 30 },
          { id: 'demand', name: 'Demand', value: 1200, maxValue: 2000, weight: 25 },
          { id: 'competition', name: 'Competition', value: 45, maxValue: 100, weight: 20 },
          { id: 'barriers', name: 'Barriers', value: 30, maxValue: 100, weight: 25 }
        ],
        createdAt: new Date().toISOString(),
        status: 'scored' as const,
        source: 'manual'
      };
      
      localStorage.setItem('saved_opportunities', JSON.stringify([testOpportunity]));
    });
  });

  test('complete workflow: import → score → opportunities → compare → validation → decision → packet', async ({ page }) => {
    // 1. Start at Import page
    await page.goto('/import');
    await expect(page.getByRole('heading', { name: /import/i })).toBeVisible();

    // 2. Paste sample CSV data
    const sampleData = `Product Name,Monthly Revenue,Search Volume,Competition Score
Test Product 2,7500,1800,35`;
    
    await page.getByRole('textbox', { name: /paste csv/i }).fill(sampleData);
    await page.getByRole('button', { name: /import/i }).click();

    // 3. Navigate to Scoring
    await page.goto('/score');
    await expect(page.getByRole('heading', { name: /product scoring/i })).toBeVisible();

    // 4. Fill scoring form
    await page.getByLabel(/product name/i).fill('E2E Test Product');
    await page.getByLabel(/revenue/i).fill('8000');
    await page.getByLabel(/demand/i).fill('1500');
    await page.getByLabel(/competition/i).fill('40');

    // 5. Save opportunity
    await page.getByRole('button', { name: /save.*opportunity/i }).click();
    await expect(page.getByText(/opportunity saved/i)).toBeVisible();

    // 6. Go to Opportunities list
    await page.goto('/opportunities');
    await expect(page.getByRole('heading', { name: /opportunities/i })).toBeVisible();

    // 7. Select 2 opportunities for comparison
    const checkboxes = page.getByRole('checkbox');
    await checkboxes.nth(0).check();
    await checkboxes.nth(1).check();

    // 8. Open comparison modal
    await page.getByRole('button', { name: /compare/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // 9. Close comparison and open opportunity detail
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: /view details/i }).first().click();

    // 10. Go to validation tab
    await page.getByRole('tab', { name: /validation/i }).click();
    
    // 11. Apply margin calculation
    await page.getByLabel(/cogs/i).fill('15');
    await page.getByLabel(/fba fee/i).fill('5');
    await page.getByRole('button', { name: /apply.*profitability/i }).click();

    // 12. Navigate to Decision page
    await page.getByRole('button', { name: /decision/i }).click();
    await expect(page.getByRole('heading', { name: /decision/i })).toBeVisible();

    // 13. Select "Proceed to Sourcing" and save
    await page.getByRole('radio', { name: /proceed.*sourcing/i }).check();
    await page.getByRole('button', { name: /save decision/i }).click();

    // 14. Generate Sourcing Packet
    await page.getByRole('button', { name: /generate.*packet/i }).click();
    await expect(page.getByRole('heading', { name: /sourcing packet/i })).toBeVisible();

    // 15. Test print functionality (stub window.print)
    await page.addInitScript(() => {
      window.print = () => console.log('Print called');
    });
    
    await page.getByRole('button', { name: /print/i }).click();
  });

  test('accessibility: keyboard navigation works', async ({ page }) => {
    await page.goto('/score');
    
    // Test tab navigation
    await page.keyboard.press('Tab'); // Skip link
    await page.keyboard.press('Tab'); // Navigation
    await page.keyboard.press('Tab'); // First form input
    
    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();
    
    // Test that all interactive elements are reachable
    let tabCount = 0;
    while (tabCount < 20) {
      await page.keyboard.press('Tab');
      tabCount++;
      const currentFocus = await page.locator(':focus').count();
      if (currentFocus === 0) break;
    }
    
    // Should have successfully navigated through form
    expect(tabCount).toBeGreaterThan(5);
  });

  test('skip to content link works', async ({ page }) => {
    await page.goto('/score');
    
    // Focus skip link and activate it
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    
    // Should focus main content
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeFocused();
  });

  test('responsive design works on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/opportunities');
    
    // Check that content is still visible and functional
    await expect(page.getByRole('heading', { name: /opportunities/i })).toBeVisible();
    
    // Check that buttons are still clickable
    const newScoreButton = page.getByRole('button', { name: /new score/i });
    await expect(newScoreButton).toBeVisible();
    await newScoreButton.click();
    
    await expect(page).toHaveURL('/score');
  });
});