import { describe, expect, it, beforeEach } from '@jest/globals';
import { ResonanceField } from '../../../core/unified/intelligenceField';
import { ResonancePattern } from '../../../types/resonancePattern';

describe('ResonanceField', () => {
  let resonanceField: ResonanceField;

  beforeEach(() => {
    resonanceField = ResonanceField.getInstance();
  });

  describe('Pattern Recognition', () => {
    it('should detect code quality patterns', async () => {
      const testCode = `
                function analyze() {
                    let x = 1;
                    return x;
                }
            `;

      const result = await resonanceField.analyzeCode(testCode);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(1);
    });

    it('should monitor QA metrics', async () => {
      const metricName = 'test_coverage';
      const metricValue = 0.85;

      await resonanceField.monitorQAMetrics(metricName, metricValue);
      const state = resonanceField.getCurrentState();

      expect(state.metrics).toBeDefined();
      expect(state.metrics[metricName]).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid code gracefully', async () => {
      const invalidCode = 'function { invalid';

      const result = await resonanceField.analyzeCode(invalidCode);
      expect(result).toBeLessThan(0.5);
    });
  });

  describe('Pattern Learning', () => {
    it('should learn from repeated patterns', async () => {
      const pattern: ResonancePattern = {
        type: 'code_quality',
        confidence: 0.8,
        metrics: {
          complexity: 0.3,
          coverage: 0.9,
        },
      };

      // Train the field
      for (let i = 0; i < 5; i++) {
        await resonanceField.monitorQAMetrics('pattern_learning', 0.8);
      }

      const state = resonanceField.getCurrentState();
      expect(state.patterns.length).toBeGreaterThan(0);
    });
  });
});
