import { AffiliateManager } from '../services/affiliate/affiliateManager';
import { MerchantMatch } from '../types/merchant';
import { DemandContext } from '../types/demandTypes';

describe('Affiliate Integration', () => {
  let manager: AffiliateManager;

  beforeEach(() => {
    manager = AffiliateManager.getInstance();
  });

  describe('Product Search', () => {
    it('should find relevant products', async () => {
      const context: DemandContext = {
        market: 'electronics',
        category: 'laptops',
        priceRange: { min: 0, max: 500 },
        intent: 'purchase',
        matches: [],
        marketTrends: [],
        userPreferences: [],
        competitiveAnalysis: {
          competitors: [],
          marketShare: 0,
          pricePoints: [],
        },
      };

      const matches = await manager.findProducts(context);
      expect(Array.isArray(matches)).toBe(true);
      matches.forEach((match: MerchantMatch) => {
        expect(match.merchantId).toBeDefined();
        expect(match.category).toBe('laptops');
        expect(match.commissionRate).toBeGreaterThan(0);
        expect(match.relevanceScore).toBeGreaterThan(0);
      });
    });
  });

  describe('Merchant Integration', () => {
    it('should validate merchant credentials', async () => {
      const isValid = await manager.validateMerchant('test-merchant');
      expect(typeof isValid).toBe('boolean');
    });
  });
});
