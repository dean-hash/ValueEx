import { DemandSignalEnhancer } from '../../../services/analysis/demandSignalEnhancer';
import { firstValueFrom } from 'rxjs';

describe('DemandSignalEnhancer', () => {
  let enhancer: DemandSignalEnhancer;

  beforeEach(() => {
    enhancer = DemandSignalEnhancer.getInstance();
  });

  describe('Signal Enhancement', () => {
    it('should add sentiment analysis to signals', async () => {
      const signal = {
        source: 'social' as const,
        intent: 'I really need a high-quality product at an affordable price',
        context: {
          urgency: 0.8,
          specificity: 0.7
        },
        timestamp: new Date(),
        confidence: 0.6
      };

      const enhanced = await firstValueFrom(enhancer.enhanceSignal(signal));

      expect(enhanced.sentiment).toBeDefined();
      expect(enhanced.sentiment.score).toBeDefined();
      expect(enhanced.sentiment.magnitude).toBeGreaterThan(0);
    });

    it('should identify relevant topics', async () => {
      const signal = {
        source: 'social' as const,
        intent: 'Looking for premium quality items with fast delivery options',
        context: {
          urgency: 0.9,
          specificity: 0.8
        },
        timestamp: new Date(),
        confidence: 0.7
      };

      const enhanced = await firstValueFrom(enhancer.enhanceSignal(signal));

      expect(enhanced.topics).toContain('quality');
      expect(enhanced.topics).toContain('delivery');
    });

    it('should boost confidence based on strong signals', async () => {
      const signal = {
        source: 'social' as const,
        intent: 'Urgently need high-quality premium products with immediate delivery',
        context: {
          urgency: 0.9,
          specificity: 0.9
        },
        timestamp: new Date(),
        confidence: 0.7
      };

      const enhanced = await firstValueFrom(enhancer.enhanceSignal(signal));

      expect(enhanced.confidence).toBeGreaterThan(0.7);
      expect(enhanced.confidence).toBeLessThanOrEqual(1.0);
    });
  });

  describe('Signal Clustering', () => {
    it('should cluster similar signals together', async () => {
      const signals = [
        {
          source: 'social' as const,
          intent: 'Looking for premium quality items',
          context: { urgency: 0.8, specificity: 0.7 },
          timestamp: new Date(),
          confidence: 0.6,
          sentiment: { score: 0.5, magnitude: 0.6 },
          topics: ['quality', 'premium']
        },
        {
          source: 'social' as const,
          intent: 'Need high-end luxury products',
          context: { urgency: 0.7, specificity: 0.8 },
          timestamp: new Date(),
          confidence: 0.7,
          sentiment: { score: 0.6, magnitude: 0.7 },
          topics: ['luxury', 'premium']
        },
        {
          source: 'social' as const,
          intent: 'Where to find cheap deals',
          context: { urgency: 0.5, specificity: 0.6 },
          timestamp: new Date(),
          confidence: 0.5,
          sentiment: { score: 0.3, magnitude: 0.4 },
          topics: ['price', 'deals']
        }
      ];

      const clustered = await enhancer.clusterSignals(signals);

      expect(clustered[0].cluster).toBeDefined();
      expect(clustered[1].cluster).toBeDefined();
      expect(clustered[0].cluster).toBe(clustered[1].cluster); // Similar signals should cluster together
      expect(clustered[0].cluster).not.toBe(clustered[2].cluster); // Different signals should be in different clusters
    });
  });

  describe('Real-world Demand Signal Processing', () => {
    const realWorldSignals = [
      {
        source: 'direct' as const,
        intent: "Need sustainable packaging solution for food delivery business",
        context: {
          urgency: 0.8,
          specificity: 0.9,
          valueConstraints: {
            timeframe: "1 month",
            budget: 5000
          }
        },
        timestamp: new Date('2024-12-31T10:00:00'),
        confidence: 0.7
      },
      {
        source: 'email' as const,
        intent: "Looking for eco-friendly packaging alternatives for restaurant chain",
        context: {
          urgency: 0.9,
          specificity: 0.8,
          valueConstraints: {
            timeframe: "2 months",
            budget: 15000
          }
        },
        timestamp: new Date('2024-12-31T10:30:00'),
        confidence: 0.8
      },
      {
        source: 'search' as const,
        intent: "Biodegradable containers wholesale supplier needed",
        context: {
          urgency: 0.7,
          specificity: 0.85,
          valueConstraints: {
            timeframe: "immediate",
            budget: 8000
          }
        },
        timestamp: new Date('2024-12-31T11:00:00'),
        confidence: 0.75
      }
    ];

    it('identifies relationships between similar demands', async () => {
      // Process first signal
      const signal1 = await firstValueFrom(enhancer.enhanceSignal(realWorldSignals[0]));
      expect(signal1.topics).toContain('packaging');
      expect(signal1.topics).toContain('sustainability');
      
      // Process second related signal
      const signal2 = await firstValueFrom(enhancer.enhanceSignal(realWorldSignals[1]));
      expect(signal2.relatedSignals.length).toBeGreaterThan(0);
      expect(signal2.relatedSignals[0].relationship).toBeGreaterThan(0.5);
      
      // Verify contextual confidence boost
      expect(signal2.contextualConfidence).toBeGreaterThan(signal2.confidence);
    });

    it('builds meaningful topic clusters', async () => {
      // Process all signals
      const enhancedSignals = await Promise.all(
        realWorldSignals.map(signal => firstValueFrom(enhancer.enhanceSignal(signal)))
      );

      // Verify topic clustering
      const sustainabilitySignals = enhancedSignals.filter(
        signal => signal.topics.includes('sustainability')
      );
      expect(sustainabilitySignals.length).toBeGreaterThan(1);

      // Check relationship strengths
      const relationships = sustainabilitySignals.flatMap(
        signal => signal.relatedSignals.map(rel => rel.relationship)
      );
      const avgRelationship = relationships.reduce((a, b) => a + b, 0) / relationships.length;
      expect(avgRelationship).toBeGreaterThan(0.3);
    });

    it('adapts confidence based on supporting evidence', async () => {
      // Process signals in sequence
      const results = [];
      for (const signal of realWorldSignals) {
        const enhanced = await firstValueFrom(enhancer.enhanceSignal(signal));
        results.push(enhanced);
      }

      // Later signals should have higher contextual confidence due to supporting evidence
      const confidenceBoosts = results.map(
        signal => signal.contextualConfidence - signal.confidence
      );
      
      // Verify increasing confidence boosts
      expect(confidenceBoosts[2]).toBeGreaterThan(confidenceBoosts[0]);
    });
  });
});