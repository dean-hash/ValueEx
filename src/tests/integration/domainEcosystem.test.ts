import { describe, expect, it, jest, beforeEach, afterEach } from '@jest/globals';
import { DomainEcosystem } from '../../services/domainEcosystem';
import { GoDaddyConnector } from '../../connectors/godaddy';
import { UnifiedIntelligenceField } from '../../services/unifiedIntelligence';
import { DomainInfo } from '../../types/domainTypes';
import { ResonanceVisualizer } from '../../visualization/resonanceVisualizer';
import { ConfigService } from '../../config/configService';

jest.mock('../../connectors/godaddy');
jest.mock('../../services/unifiedIntelligence');
jest.mock('../../visualization/resonanceVisualizer');
jest.mock('../../config/configService');

describe('DomainEcosystem Integration Tests', () => {
  let ecosystem: DomainEcosystem;
  let mockGodaddy: jest.Mocked<GoDaddyConnector>;
  let mockIntelligence: jest.Mocked<UnifiedIntelligenceField>;
  let mockVisualizer: jest.Mocked<ResonanceVisualizer>;
  let mockConfig: jest.Mocked<ConfigService>;

  beforeEach(() => {
    mockConfig = {
      get: jest.fn(),
      getAll: jest.fn(),
    } as unknown as jest.Mocked<ConfigService>;

    mockGodaddy = {
      checkDomainAvailability: jest.fn(),
      purchaseDomain: jest.fn(),
      configureDNS: jest.fn(),
    } as unknown as jest.Mocked<GoDaddyConnector>;

    mockIntelligence = {
      analyzeDomain: jest.fn(),
      updateDomainState: jest.fn(),
      getDomainState: jest.fn(),
    } as unknown as jest.Mocked<UnifiedIntelligenceField>;

    mockVisualizer = {
      visualizeDomainMetrics: jest.fn(),
      updateVisualization: jest.fn(),
    } as unknown as jest.Mocked<ResonanceVisualizer>;

    ecosystem = new DomainEcosystem(mockConfig, mockGodaddy, mockIntelligence, mockVisualizer);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockDomainInfo: DomainInfo = {
    name: 'test-domain.com',
    status: 'active',
    resonance: 0.8,
    metrics: {
      stability: 0.9,
      coherence: 0.7,
    },
  };

  describe('Domain Analysis', () => {
    it('should analyze domain and update state', async () => {
      mockIntelligence.analyzeDomain.mockResolvedValue(mockDomainInfo);
      mockIntelligence.getDomainState.mockResolvedValue({
        domains: [mockDomainInfo],
        stability: 0.9,
        coherence: 0.7,
        lastUpdated: new Date(),
      });

      const result = await ecosystem.analyzeDomain('test-domain.com');

      expect(result).toEqual(mockDomainInfo);
      expect(mockIntelligence.analyzeDomain).toHaveBeenCalledWith('test-domain.com');
      expect(mockIntelligence.updateDomainState).toHaveBeenCalled();
    });

    it('should handle domain analysis errors', async () => {
      mockIntelligence.analyzeDomain.mockRejectedValue(new Error('Analysis failed'));

      await expect(ecosystem.analyzeDomain('test-domain.com')).rejects.toThrow('Analysis failed');
    });
  });

  describe('Domain Availability', () => {
    it('should check domain availability', async () => {
      mockGodaddy.checkDomainAvailability.mockResolvedValue({
        available: true,
        price: 9.99,
      });

      const result = await ecosystem.checkDomainAvailability('test-domain.com');

      expect(result.available).toBe(true);
      expect(result.price).toBe(9.99);
    });

    it('should handle availability check errors', async () => {
      mockGodaddy.checkDomainAvailability.mockRejectedValue(new Error('API error'));

      await expect(ecosystem.checkDomainAvailability('test-domain.com')).rejects.toThrow(
        'API error'
      );
    });
  });

  describe('Domain Purchase', () => {
    it('should purchase available domain', async () => {
      mockGodaddy.checkDomainAvailability.mockResolvedValue({
        available: true,
        price: 9.99,
      });
      mockGodaddy.purchaseDomain.mockResolvedValue(true);
      mockIntelligence.getDomainState.mockResolvedValue({
        domains: [],
        stability: 0,
        coherence: 0,
        lastUpdated: new Date(),
      });

      const result = await ecosystem.purchaseDomain('test-domain.com');

      expect(result).toBe(true);
      expect(mockGodaddy.purchaseDomain).toHaveBeenCalledWith('test-domain.com');
      expect(mockIntelligence.updateDomainState).toHaveBeenCalled();
    });

    it('should not purchase unavailable domain', async () => {
      mockGodaddy.checkDomainAvailability.mockResolvedValue({
        available: false,
      });

      await expect(ecosystem.purchaseDomain('test-domain.com')).rejects.toThrow(
        'Domain is not available'
      );
    });
  });
});
