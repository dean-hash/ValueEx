import { describe, expect, jest, beforeEach } from '@jest/globals';
import { DemandMatcher } from '../../../services/mvp/demandMatcher';
import type { DemandSignal, MVPProduct } from '../../../types/demandTypes';
import { DemandSignalEnhancer } from '../../../services/analysis/demandSignalEnhancer';
import { InfluenceAnalyzer } from '../../../services/analysis/influenceAnalyzer';
import { IntelligenceCoordinator } from '../../../services/analysis/intelligenceCoordinator';
import { CorrelationAnalyzer } from '../../../services/analysis/correlationAnalyzer';
import { DemandInference } from '../../../services/analysis/providers/demandInference';
import { ValueSignalProcessor } from '../../../services/analysis/providers/valueSignalProcessor';
import { ContextManager } from '../../../services/analysis/providers/contextManager';

jest.mock('../../../services/analysis/demandSignalEnhancer');
jest.mock('../../../services/analysis/influenceAnalyzer');
jest.mock('../../../services/analysis/intelligenceCoordinator');
jest.mock('../../../services/analysis/correlationAnalyzer');
jest.mock('../../../services/analysis/providers/demandInference');
jest.mock('../../../services/analysis/providers/valueSignalProcessor');
jest.mock('../../../services/analysis/providers/contextManager');

describe('DemandMatcher', () => {
  let matcher: DemandMatcher;
  let signalEnhancer: jest.Mocked<DemandSignalEnhancer>;
  let influenceAnalyzer: jest.Mocked<InfluenceAnalyzer>;
  let intelligence: jest.Mocked<IntelligenceCoordinator>;
  let correlationAnalyzer: jest.Mocked<CorrelationAnalyzer>;
  let demandInference: jest.Mocked<DemandInference>;
  let valueProcessor: jest.Mocked<ValueSignalProcessor>;
  let contextManager: jest.Mocked<ContextManager>;
  let mockDemandSignal: DemandSignal;
  let mockSupplySignal: MVPProduct;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock instances
    signalEnhancer = {
      getInstance: jest.fn().mockReturnThis(),
      enhanceSignal: jest
        .fn()
        .mockReturnValue({ pipe: () => ({ toPromise: () => Promise.resolve({}) }) }),
    } as any;

    influenceAnalyzer = {
      getInstance: jest.fn().mockReturnThis(),
      analyzeInfluence: jest.fn().mockResolvedValue({
        expertiseMatch: 0.8,
        communityEngagement: 0.7,
        valueAlignment: true,
      }),
    } as any;

    intelligence = {
      getInstance: jest.fn().mockReturnThis(),
      gatherLocalInsights: jest.fn().mockResolvedValue({ confidence: 0.9 }),
      gatherResearchInsights: jest.fn().mockResolvedValue({ confidence: 0.8 }),
      gatherSystemResources: jest.fn().mockResolvedValue({ confidence: 0.7 }),
      findRelevantProducts: jest.fn().mockResolvedValue([]),
    } as any;

    correlationAnalyzer = {
      getInstance: jest.fn().mockReturnThis(),
      getTemporalPatterns: jest.fn().mockReturnValue(new Map()),
      getMultiSourceCorrelations: jest.fn().mockReturnValue(new Map()),
    } as any;

    demandInference = {
      inferFromBehavior: jest.fn().mockResolvedValue([]),
    } as any;

    valueProcessor = {
      processSignals: jest.fn().mockResolvedValue([]),
    } as any;

    contextManager = {
      buildContext: jest.fn().mockResolvedValue({
        signal: {},
        influence: {},
        behavior: [],
        value: [],
        intelligence: [],
        patterns: new Map(),
        correlations: new Map(),
      }),
    } as any;

    matcher = DemandMatcher.getInstance();

    mockDemandSignal = {
      id: 'test-demand',
      query: 'test query',
      source: 'test',
      timestamp: new Date().toISOString(),
      confidence: 0.8,
      metadata: {}
    };

    mockSupplySignal = {
      id: 'test-supply',
      product: 'test product',
      source: 'test',
      timestamp: new Date().toISOString(),
      confidence: 0.8,
      metadata: {}
    };
  });

  describe('findMatches', () => {
    it('should return empty array for non-authentic demand', async (): Promise<void> => {
      const signal: DemandSignal = {
        id: 'test1',
        query: 'test query',
        source: 'test',
        strength: 0.5,
        vertical: { id: 'test', name: 'test' },
        insights: {
          confidence: 0.5,
          urgency: 0.3,
          keywords: [],
          context: '',
          valueEvidence: {
            authenticityMarkers: [],
            realWorldImpact: [],
            practicalUtility: [],
          },
        },
      };

      const matches = await matcher.findMatches(signal);
      expect(matches).toEqual([]);
    });

    it('should find matches for authentic demand signals', async (): Promise<void> => {
      const signal: DemandSignal = {
        id: 'test2',
        query: 'need project management software',
        source: 'business forum',
        strength: 0.8,
        vertical: { id: 'software', name: 'Software' },
        insights: {
          confidence: 0.9,
          urgency: 0.7,
          keywords: ['project management', 'team collaboration'],
          context: 'Small business looking to improve team coordination',
          valueEvidence: {
            authenticityMarkers: ['verified business need', 'current process pain points'],
            realWorldImpact: ['productivity improvement', 'team efficiency'],
            practicalUtility: ['task tracking', 'team communication'],
          },
          demandPatterns: {
            frequency: 0.8,
            consistency: 0.85,
            evidence: ['recurring need', 'multiple team requests'],
          },
        },
      };

      const product: MVPProduct = {
        id: 'pm1',
        name: 'ProjectFlow Pro',
        description: 'Enterprise project management solution',
        price: 29.99,
        category: 'Software',
        vertical: { id: 'software', name: 'Software' },
        tags: ['project management', 'team collaboration', 'task tracking'],
        valueProposition: {
          coreBenefit: 'Streamline team coordination and project delivery',
          evidencePoints: ['83% productivity increase', 'reduced meeting time'],
          realWorldImpact: ['team efficiency', 'faster project completion'],
        },
        resonanceFactors: {
          demandMatch: 0.9,
          marketFit: 0.85,
          valueAlignment: 0.8,
          practicalUtility: 0.9,
          sustainableValue: 0.85,
        },
        source: 'manual',
        status: 'active',
      };

      // Mock digitalIntelligence to return our test product
      jest.spyOn(intelligence, 'findRelevantProducts').mockResolvedValue([product]);

      const matches = await matcher.findMatches(signal);
      expect(matches.length).toBe(1);
      expect(matches[0].resonanceFactors?.valueAlignment).toBeGreaterThan(0.6);
    });

    it('should rank matches by value creation potential', async (): Promise<void> => {
      const signal: DemandSignal = {
        id: 'test3',
        query: 'sustainable packaging solutions',
        source: 'industry research',
        strength: 0.85,
        vertical: { id: 'packaging', name: 'Packaging' },
        insights: {
          confidence: 0.85,
          urgency: 0.7,
          keywords: ['eco-friendly', 'sustainable', 'packaging'],
          context: 'Food company seeking sustainable packaging options',
          valueEvidence: {
            authenticityMarkers: ['environmental certification', 'market research'],
            realWorldImpact: ['reduced waste', 'customer satisfaction'],
            practicalUtility: ['food preservation', 'cost efficiency'],
          },
        },
      };

      const products: MVPProduct[] = [
        {
          id: 'pkg1',
          name: 'EcoWrap Premium',
          description: 'Biodegradable food packaging',
          price: 199.99,
          category: 'Packaging',
          vertical: { id: 'packaging', name: 'Packaging' },
          tags: ['eco-friendly', 'food-grade', 'sustainable'],
          valueProposition: {
            coreBenefit: 'Zero-waste food packaging solution',
            evidencePoints: ['100% biodegradable', 'FDA approved'],
            realWorldImpact: ['reduced waste', 'improved shelf life'],
          },
          resonanceFactors: {
            demandMatch: 0.9,
            marketFit: 0.85,
            valueAlignment: 0.9,
            practicalUtility: 0.8,
            sustainableValue: 0.9,
          },
          source: 'manual',
          status: 'active',
        },
        {
          id: 'pkg2',
          name: 'BasicWrap',
          description: 'Standard food packaging',
          price: 99.99,
          category: 'Packaging',
          vertical: { id: 'packaging', name: 'Packaging' },
          tags: ['food-grade', 'standard'],
          valueProposition: {
            coreBenefit: 'Basic food packaging solution',
            evidencePoints: ['FDA approved'],
            realWorldImpact: ['food protection'],
          },
          resonanceFactors: {
            demandMatch: 0.7,
            marketFit: 0.6,
            valueAlignment: 0.5,
            practicalUtility: 0.6,
            sustainableValue: 0.4,
          },
          source: 'manual',
          status: 'active',
        },
      ];

      // Mock digitalIntelligence to return our test products
      jest.spyOn(intelligence, 'findRelevantProducts').mockResolvedValue(products);

      const matches = await matcher.findMatches(signal);
      expect(matches.length).toBe(2);
      expect(matches[0].id).toBe('pkg1'); // Higher value creation score should be first
      expect(matches[1].id).toBe('pkg2');
    });
  });

  describe('Intelligence Integration', () => {
    it('should enhance signals with NLP and sentiment analysis', async (): Promise<void> => {
      const signal: DemandSignal = {
        id: 'test1',
        query: 'sustainable packaging solutions',
        source: 'industry research',
        strength: 0.9,
        vertical: { id: 'packaging', name: 'Packaging' },
        insights: {
          confidence: 0.8,
          urgency: 0.7,
          keywords: ['sustainable', 'packaging', 'eco-friendly'],
          context: 'Food delivery business seeking sustainable packaging',
          valueEvidence: {
            authenticityMarkers: ['verified business', 'industry research'],
            realWorldImpact: ['environmental impact', 'customer satisfaction'],
            practicalUtility: ['cost effective', 'biodegradable'],
          },
        },
      };

      await matcher.findMatches(signal);

      expect(signalEnhancer.enhanceSignal).toHaveBeenCalledWith(signal);
      expect(influenceAnalyzer.analyzeInfluence).toHaveBeenCalled();
      expect(demandInference.inferFromBehavior).toHaveBeenCalled();
      expect(valueProcessor.processSignals).toHaveBeenCalled();
      expect(correlationAnalyzer.getTemporalPatterns).toHaveBeenCalled();
      expect(intelligence.gatherLocalInsights).toHaveBeenCalled();
      expect(contextManager.buildContext).toHaveBeenCalled();
    });

    it('should find matches using comprehensive intelligence', async (): Promise<void> => {
      const signal: DemandSignal = {
        id: 'test2',
        query: 'team collaboration software',
        source: 'business forum',
        strength: 0.8,
        vertical: { id: 'software', name: 'Software' },
        insights: {
          confidence: 0.9,
          urgency: 0.7,
          keywords: ['collaboration', 'team management'],
          context: 'Remote team needs better coordination tools',
          valueEvidence: {
            authenticityMarkers: ['verified business need', 'remote work challenges'],
            realWorldImpact: ['team productivity', 'communication efficiency'],
            practicalUtility: ['easy to use', 'integrates with existing tools'],
          },
        },
      };

      const mockProduct: MVPProduct = {
        id: 'product1',
        name: 'TeamCollab Pro',
        description: 'Advanced team collaboration platform',
        category: 'Software',
        vertical: { id: 'software', name: 'Software' },
        price: 29.99,
        tags: ['collaboration', 'team management', 'remote work'],
        valueProposition: {
          coreBenefit: 'Seamless team collaboration for remote teams',
          evidencePoints: ['Used by 1000+ remote teams', '99.9% uptime'],
          realWorldImpact: ['30% increase in team productivity', 'Better work-life balance'],
        },
      };

      intelligence.findRelevantProducts.mockResolvedValue([mockProduct]);
      valueProcessor.processSignals.mockResolvedValue([{ matches: ['product1'], confidence: 0.9 }]);
      demandInference.inferFromBehavior.mockResolvedValue([
        { matches: ['product1'], confidence: 0.8 },
      ]);

      const matches = await matcher.findMatches(signal);

      expect(matches).toHaveLength(1);
      expect(matches[0].id).toBe('product1');
      expect(matches[0].resonanceFactors).toBeDefined();
    });

    it('should rank matches using weighted value creation factors', async (): Promise<void> => {
      const signal: DemandSignal = {
        id: 'test3',
        query: 'sustainable packaging',
        source: 'industry',
        strength: 0.9,
        vertical: { id: 'packaging', name: 'Packaging' },
        insights: {
          confidence: 0.8,
          urgency: 0.7,
          keywords: ['sustainable', 'eco-friendly'],
          context: 'Need environmentally friendly packaging solution',
          valueEvidence: {
            authenticityMarkers: ['industry certification', 'market demand'],
            realWorldImpact: ['reduced waste', 'brand reputation'],
            practicalUtility: ['cost effective', 'scalable'],
          },
        },
      };

      const mockProducts: MVPProduct[] = [
        {
          id: 'product1',
          name: 'EcoPack Premium',
          category: 'Packaging',
          vertical: { id: 'packaging', name: 'Packaging' },
          price: 100,
          tags: ['sustainable', 'premium'],
          valueProposition: {
            coreBenefit: 'Premium sustainable packaging',
            evidencePoints: ['Certified biodegradable', 'Award winning'],
            realWorldImpact: ['90% waste reduction', 'Enhanced brand image'],
          },
        },
        {
          id: 'product2',
          name: 'EcoPack Basic',
          category: 'Packaging',
          vertical: { id: 'packaging', name: 'Packaging' },
          price: 50,
          tags: ['sustainable', 'basic'],
          valueProposition: {
            coreBenefit: 'Basic sustainable packaging',
            evidencePoints: ['Biodegradable'],
            realWorldImpact: ['Reduced waste'],
          },
        },
      ];

      intelligence.findRelevantProducts.mockResolvedValue(mockProducts);
      valueProcessor.processSignals.mockResolvedValue([
        { matches: ['product1'], confidence: 0.9 },
        { matches: ['product2'], confidence: 0.7 },
      ]);
      demandInference.inferFromBehavior.mockResolvedValue([
        { matches: ['product1', 'product2'], confidence: 0.8 },
      ]);

      const matches = await matcher.findMatches(signal);

      expect(matches).toHaveLength(2);
      expect(matches[0].id).toBe('product1'); // Premium should rank higher
      expect(matches[0].resonanceFactors.valueAlignment).toBeGreaterThan(
        matches[1].resonanceFactors.valueAlignment
      );
    });
  });
});
