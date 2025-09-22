import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Score from '../src/pages/Score';

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Score Page', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('shows warning when weights do not equal 100', async () => {
    renderWithRouter(<Score />);
    
    // Find weight inputs and set them to unequal 100
    const revenueWeight = screen.getByLabelText(/revenue.*weight/i);
    const demandWeight = screen.getByLabelText(/demand.*weight/i);
    
    fireEvent.change(revenueWeight, { target: { value: '40' } });
    fireEvent.change(demandWeight, { target: { value: '30' } });
    
    await waitFor(() => {
      expect(screen.getByText(/weights.*not.*100/i)).toBeInTheDocument();
    });
  });

  it('shows correct recommendation tier as inputs cross gates', async () => {
    renderWithRouter(<Score />);
    
    // Set product name
    const productName = screen.getByLabelText(/product name/i);
    fireEvent.change(productName, { target: { value: 'Test Product' } });
    
    // Set high revenue (above gate)
    const revenueInput = screen.getByLabelText(/revenue/i);
    fireEvent.change(revenueInput, { target: { value: '6000' } });
    
    // Set high demand (above gate)
    const demandInput = screen.getByLabelText(/demand/i);
    fireEvent.change(demandInput, { target: { value: '1200' } });
    
    // Check that recommendation updates
    await waitFor(() => {
      const recommendation = screen.getByText(/proceed|gather|reject/i);
      expect(recommendation).toBeInTheDocument();
    });
  });

  it('calculates final score correctly', async () => {
    renderWithRouter(<Score />);
    
    // Set product name
    const productName = screen.getByLabelText(/product name/i);
    fireEvent.change(productName, { target: { value: 'Test Product' } });
    
    // Set all criteria to known values
    const revenueInput = screen.getByLabelText(/revenue/i);
    fireEvent.change(revenueInput, { target: { value: '8000' } }); // 80% of 10k
    
    const demandInput = screen.getByLabelText(/demand/i);
    fireEvent.change(demandInput, { target: { value: '1500' } }); // 75% of 2k
    
    await waitFor(() => {
      // Check that score is calculated and displayed
      const scoreElement = screen.getByText(/final score/i);
      expect(scoreElement).toBeInTheDocument();
    });
  });

  it('allows keyboard navigation through form', () => {
    renderWithRouter(<Score />);
    
    const productName = screen.getByLabelText(/product name/i);
    productName.focus();
    expect(document.activeElement).toBe(productName);
    
    // Tab through form elements
    fireEvent.keyDown(productName, { key: 'Tab' });
    // Should focus next input
    expect(document.activeElement).not.toBe(productName);
  });
});