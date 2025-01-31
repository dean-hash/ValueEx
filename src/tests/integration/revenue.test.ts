import { RevenueGenerator } from '../../revenue-generator';
import { RedisConfig } from '../../services/cache/redisConfig';
import { DynamicsClient } from '../../services/dynamics/dynamicsClient';
import { AwinClient } from '../../services/affiliate/awinClient';
import { JasperClient } from '../../services/affiliate/jasperClient';

jest.mock('../../services/cache/redisConfig');
jest.mock('../../services/dynamics/dynamicsClient');
jest.mock('../../services/affiliate/awinClient');
jest.mock('../../services/affiliate/jasperClient');

describe('Revenue Generation Integration Tests', () => {
  let revenueGenerator: RevenueGenerator;

  beforeAll(async () => {
    // Initialize Redis
    await RedisConfig.initialize();
  });

  beforeEach(() => {
    revenueGenerator = new RevenueGenerator();
  });

  afterAll(async () => {
    await RedisConfig.disconnect();
  });

  describe('Affiliate Integration', () => {
    it('should track Awin commissions', async () => {
      const mockTransactions = [
        {
          id: '1',
          programId: 'test',
          amount: 100,
          status: 'approved',
          timestamp: new Date().toISOString(),
        },
      ];

      (AwinClient.prototype.getTransactions as jest.Mock).mockResolvedValue(mockTransactions);

      await revenueGenerator.start();

      expect(AwinClient.prototype.getTransactions).toHaveBeenCalled();
    });

    it('should track Jasper commissions', async () => {
      const mockTransactions = [
        {
          id: '1',
          clickId: 'test',
          commission: 50,
          status: 'completed',
          createdAt: new Date().toISOString(),
        },
      ];

      (JasperClient.prototype.getTransactions as jest.Mock).mockResolvedValue(mockTransactions);

      await revenueGenerator.start();

      expect(JasperClient.prototype.getTransactions).toHaveBeenCalled();
    });
  });

  describe('Dynamics 365 Integration', () => {
    it('should create opportunities for domain deals', async () => {
      const mockDeals = [
        {
          domain: 'test.com',
          price: 100,
          lastChecked: new Date().toISOString(),
        },
      ];

      jest.spyOn(revenueGenerator as any, 'findDomainDeals').mockResolvedValue(mockDeals);

      await revenueGenerator.start();

      expect(DynamicsClient.prototype.createOpportunity).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Domain Opportunity: test.com',
          estimatedvalue: 100,
        })
      );
    });

    it('should update contact revenue in Dynamics', async () => {
      const mockContact = {
        contactid: '1',
        revenue: 100,
      };

      (DynamicsClient.prototype.getContactByAffiliateId as jest.Mock).mockResolvedValue(
        mockContact
      );

      await revenueGenerator.start();

      expect(DynamicsClient.prototype.updateContact).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          revenue: expect.any(Number),
        })
      );
    });
  });
});
