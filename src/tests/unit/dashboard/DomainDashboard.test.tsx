import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DomainDashboard from '../../../app/dashboard/page';

// Mock the fetch function
global.fetch = jest.fn();

// Mock Chart.js to avoid canvas errors in tests
jest.mock('chart.js');
jest.mock('react-chartjs-2', () => ({
  Bar: () => null,
  Pie: () => null,
}));

describe('DomainDashboard', () => {
  const mockDomains = ['example.com', 'test.com'];
  const mockMetrics = [
    {
      domain: 'example.com',
      estimatedValue: 1000,
      seoValue: 0.8,
      marketDemand: 0.7,
      affiliatePotential: 0.9,
      recommendedStrategy: 'Develop',
      niche: 'Technology',
    },
    {
      domain: 'test.com',
      estimatedValue: 2000,
      seoValue: 0.6,
      marketDemand: 0.8,
      affiliatePotential: 0.7,
      recommendedStrategy: 'Sell',
      niche: 'Education',
    },
  ];
  const mockAffiliateRecs = {
    'example.com': [
      {
        network: 'Amazon',
        relevance: 0.9,
        averageCommission: '4%',
        products: ['laptops', 'accessories'],
      },
    ],
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock API responses
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url === '/api/domains') {
        return Promise.resolve({
          json: () => Promise.resolve(mockDomains),
        });
      }
      if (url.includes('/metrics')) {
        return Promise.resolve({
          json: () => Promise.resolve(mockMetrics[0]),
        });
      }
      if (url.includes('/affiliate-recommendations')) {
        return Promise.resolve({
          json: () => Promise.resolve(mockAffiliateRecs['example.com']),
        });
      }
    });
  });

  test('renders dashboard title', () => {
    render(<DomainDashboard />);
    expect(screen.getByText('Domain Portfolio Analysis')).toBeInTheDocument();
  });

  test('loads and displays domain data', async () => {
    render(<DomainDashboard />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/domains');
    });

    // Check if metrics table headers are present
    expect(screen.getByText('Est. Value')).toBeInTheDocument();
    expect(screen.getByText('SEO Value')).toBeInTheDocument();
    expect(screen.getByText('Market Demand')).toBeInTheDocument();
  });

  test('handles API errors gracefully', async () => {
    // Mock API error
    (global.fetch as jest.Mock).mockImplementationOnce(() => Promise.reject('API Error'));

    render(<DomainDashboard />);

    // Verify error handling (you might want to add error states to your component)
    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
    });
  });

  test('displays affiliate recommendations when available', async () => {
    render(<DomainDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Affiliate Opportunities')).toBeInTheDocument();
    });
  });
});
