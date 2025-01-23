"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResonanceMetrics = void 0;
const resonanceEngine_1 = require("../resonance/resonanceEngine");
const valueManifestor_1 = require("../resonance/valueManifestor");
const metricsCollector_1 = require("./metricsCollector");
const logger_1 = require("../../utils/logger");
class ResonanceMetrics {
    constructor() {
        this.resonance = resonanceEngine_1.ResonanceEngine.getInstance();
        this.manifestor = valueManifestor_1.ValueManifestor.getInstance();
        this.metrics = metricsCollector_1.MetricsCollector.getInstance();
        this.startMetricsCollection();
    }
    static getInstance() {
        if (!ResonanceMetrics.instance) {
            ResonanceMetrics.instance = new ResonanceMetrics();
        }
        return ResonanceMetrics.instance;
    }
    startMetricsCollection() {
        setInterval(() => {
            const activeFields = Array.from(this.resonance['activeFields'].values());
            const metrics = {
                totalFields: activeFields.length,
                totalPoints: activeFields.reduce((sum, f) => sum + f.points.length, 0),
                averageHarmonics: activeFields.reduce((sum, f) => sum + f.harmonics.reduce((h, v) => h + v, 0) / f.harmonics.length, 0) / activeFields.length,
                activeSignals: activeFields.flatMap((f) => this.resonance.detectValuePatterns(f)).length,
            };
            this.metrics.trackMetric('resonance.fields.total', metrics.totalFields);
            this.metrics.trackMetric('resonance.points.total', metrics.totalPoints);
            this.metrics.trackMetric('resonance.harmonics.average', metrics.averageHarmonics);
            this.metrics.trackMetric('resonance.signals.active', metrics.activeSignals);
            logger_1.logger.info('Resonance metrics collected', metrics);
            // Check for high-value patterns
            if (metrics.averageHarmonics > 0.7) {
                logger_1.logger.info('High resonance detected - amplifying value signals');
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
exports.ResonanceMetrics = ResonanceMetrics;
// Initialize metrics
ResonanceMetrics.getInstance();
//# sourceMappingURL=resonanceMetrics.js.map