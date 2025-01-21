import { ResonanceEngine } from '../resonance/resonanceEngine';
import { ValueManifestor } from '../resonance/valueManifestor';
import { MetricsCollector } from './metricsCollector';
import { logger } from '../../utils/logger';

export class ResonanceMetrics {
  private static instance: ResonanceMetrics;
  private resonance = ResonanceEngine.getInstance();
  private manifestor = ValueManifestor.getInstance();
  private metrics = MetricsCollector.getInstance();

  private constructor() {
    this.startMetricsCollection();
  }

  static getInstance(): ResonanceMetrics {
    if (!ResonanceMetrics.instance) {
      ResonanceMetrics.instance = new ResonanceMetrics();
    }
    return ResonanceMetrics.instance;
  }

  private startMetricsCollection() {
    setInterval(() => {
      const activeFields = Array.from(this.resonance['activeFields'].values());

      const metrics = {
        totalFields: activeFields.length,
        totalPoints: activeFields.reduce((sum, f) => sum + f.points.length, 0),
        averageHarmonics:
          activeFields.reduce(
            (sum, f) => sum + f.harmonics.reduce((h, v) => h + v, 0) / f.harmonics.length,
            0
          ) / activeFields.length,
        activeSignals: activeFields.flatMap((f) => this.resonance.detectValuePatterns(f)).length,
      };

      this.metrics.trackMetric('resonance.fields.total', metrics.totalFields);
      this.metrics.trackMetric('resonance.points.total', metrics.totalPoints);
      this.metrics.trackMetric('resonance.harmonics.average', metrics.averageHarmonics);
      this.metrics.trackMetric('resonance.signals.active', metrics.activeSignals);

      logger.info('Resonance metrics collected', metrics);

      // Check for high-value patterns
      if (metrics.averageHarmonics > 0.7) {
        logger.info('High resonance detected - amplifying value signals');

        activeFields.forEach((field) => {
          const patterns = this.resonance.detectValuePatterns(field);
          patterns
            .filter((p) => p.probability > 0.8)
            .forEach((p) => this.resonance.emitValueSignal(p));
        });
      }
    }, 60000); // Every minute
  }
}

// Initialize metrics
ResonanceMetrics.getInstance();
