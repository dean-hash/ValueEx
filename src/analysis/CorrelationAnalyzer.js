"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CorrelationAnalyzer = void 0;
var events_1 = require("events");
var CorrelationAnalyzer = /** @class */ (function (_super) {
    __extends(CorrelationAnalyzer, _super);
    function CorrelationAnalyzer(metricsCollector) {
        var _this = _super.call(this) || this;
        _this.metricsCollector = metricsCollector;
        return _this;
    }
    CorrelationAnalyzer.getInstance = function (metricsCollector) {
        if (!CorrelationAnalyzer.instance) {
            CorrelationAnalyzer.instance = new CorrelationAnalyzer(metricsCollector);
        }
        return CorrelationAnalyzer.instance;
    };
    CorrelationAnalyzer.prototype.detectPatterns = function (metricId) {
        return __awaiter(this, void 0, void 0, function () {
            var metrics, patterns;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.metricsCollector.getMetricHistory(metricId)];
                    case 1:
                        metrics = _a.sent();
                        patterns = metrics.map(function (metric) { return ({
                            id: "pattern-".concat(metric.id),
                            name: "Pattern for ".concat(metric.name),
                            patterns: [metric.name],
                            timestamps: [metric.timestamp],
                            values: [metric.value],
                            confidence: 0.8,
                            timestamp: metric.timestamp,
                            value: metric.value
                        }); });
                        return [2 /*return*/, patterns];
                }
            });
        });
    };
    CorrelationAnalyzer.prototype.findCorrelations = function (metricIds) {
        return __awaiter(this, void 0, void 0, function () {
            var metricsData, correlations, i, j, correlation;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.all(metricIds.map(function (id) { return _this.metricsCollector.getMetricHistory(id); }))];
                    case 1:
                        metricsData = _a.sent();
                        correlations = [];
                        for (i = 0; i < metricsData.length; i++) {
                            for (j = i + 1; j < metricsData.length; j++) {
                                correlation = {
                                    id: "correlation-".concat(i, "-").concat(j),
                                    sources: [metricIds[i], metricIds[j]],
                                    timestamps: metricsData[i].map(function (m) { return m.timestamp; }),
                                    values: metricsData[i].map(function (m) { return m.value; }),
                                    strength: this.calculateCorrelation(metricsData[i].map(function (m) { return m.value; }), metricsData[j].map(function (m) { return m.value; })),
                                    direction: 'positive'
                                };
                                correlations.push(correlation);
                            }
                        }
                        return [2 /*return*/, correlations];
                }
            });
        });
    };
    CorrelationAnalyzer.prototype.analyzeTrends = function (metricIds) {
        return __awaiter(this, void 0, void 0, function () {
            var metricsData, trends;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.all(metricIds.map(function (id) { return _this.metricsCollector.getMetricHistory(id); }))];
                    case 1:
                        metricsData = _a.sent();
                        trends = metricsData.map(function (metrics, index) {
                            var values = metrics.map(function (m) { return m.value; });
                            var trend = _this.calculateTrend(values);
                            return {
                                id: "trend-".concat(metricIds[index]),
                                name: "Trend for ".concat(metricIds[index]),
                                timestamps: metrics.map(function (m) { return m.timestamp; }),
                                values: values,
                                trend: {
                                    value: trend.value,
                                    direction: trend.direction,
                                    confidence: trend.confidence
                                },
                                confidence: trend.confidence
                            };
                        });
                        return [2 /*return*/, trends];
                }
            });
        });
    };
    CorrelationAnalyzer.prototype.getTemporalPatterns = function (data) {
        var _this = this;
        var patterns = [];
        var metrics = Object.keys(data[0] || {});
        metrics.forEach(function (metric) {
            var values = data.map(function (d) { return d[metric]; });
            var trend = _this.calculateTrend(values);
            var confidence = _this.calculatePredictionConfidence(values, trend, _this.detectSeasonality(values));
            patterns.push({
                metric: metric,
                patterns: [{
                        id: "".concat(metric, "-trend"),
                        value: trend,
                        confidence: confidence,
                        trend: trend
                    }]
            });
        });
        return patterns;
    };
    CorrelationAnalyzer.prototype.getMultiSourceCorrelations = function (metrics) {
        var correlations = [];
        var metricNames = Object.keys(metrics[0] || {});
        for (var i = 0; i < metricNames.length; i++) {
            var _loop_1 = function (j) {
                var source1 = metricNames[i];
                var source2 = metricNames[j];
                var values1 = metrics.map(function (m) { return m[source1]; });
                var values2 = metrics.map(function (m) { return m[source2]; });
                var correlation = this_1.calculateCorrelation(values1, values2);
                var confidence = Math.abs(correlation);
                if (confidence > 0.3) {
                    correlations.push({
                        sources: [source1, source2],
                        correlation: correlation,
                        confidence: confidence
                    });
                }
            };
            var this_1 = this;
            for (var j = i + 1; j < metricNames.length; j++) {
                _loop_1(j);
            }
        }
        return correlations;
    };
    CorrelationAnalyzer.prototype.getTrends = function (data) {
        var _this = this;
        var trends = [];
        var metrics = Object.keys(data[0] || {});
        metrics.forEach(function (metric) {
            var values = data.map(function (d) { return d[metric]; });
            var trendValue = _this.calculateTrend(values);
            var confidence = _this.calculatePredictionConfidence(values, trendValue, _this.detectSeasonality(values));
            trends.push({
                metric: metric,
                trend: {
                    value: trendValue,
                    direction: trendValue > 0.1 ? 'up' : trendValue < -0.1 ? 'down' : 'stable',
                    confidence: confidence
                }
            });
        });
        return trends;
    };
    CorrelationAnalyzer.prototype.findRelatedMetrics = function (metric) {
        // Implementation will be added later
        return [];
    };
    CorrelationAnalyzer.prototype.detectAnomalies = function (data) {
        // Implementation will be added later
        return [];
    };
    CorrelationAnalyzer.prototype.calculateCorrelation = function (x, y) {
        var n = Math.min(x.length, y.length);
        if (n < 2)
            return 0;
        var sumX = x.reduce(function (a, b) { return a + b; }, 0);
        var sumY = y.reduce(function (a, b) { return a + b; }, 0);
        var sumXY = x.reduce(function (a, b, i) { return a + b * y[i]; }, 0);
        var sumX2 = x.reduce(function (a, b) { return a + b * b; }, 0);
        var sumY2 = y.reduce(function (a, b) { return a + b * b; }, 0);
        var numerator = n * sumXY - sumX * sumY;
        var denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
        return denominator === 0 ? 0 : numerator / denominator;
    };
    CorrelationAnalyzer.prototype.calculateTrend = function (values) {
        if (values.length < 2)
            return 0;
        var n = values.length;
        var x = Array.from({ length: n }, function (_, i) { return i; });
        return this.calculateCorrelation(x, values);
    };
    CorrelationAnalyzer.prototype.detectSeasonality = function (values) {
        // Simple seasonality detection using autocorrelation
        if (values.length < 4)
            return 0;
        var lags = Math.floor(values.length / 2);
        var maxCorrelation = 0;
        for (var lag = 2; lag < lags; lag++) {
            var series1 = values.slice(0, -lag);
            var series2 = values.slice(lag);
            var correlation = Math.abs(this.calculateCorrelation(series1, series2));
            maxCorrelation = Math.max(maxCorrelation, correlation);
        }
        return maxCorrelation;
    };
    CorrelationAnalyzer.prototype.calculatePredictionConfidence = function (values, trend, seasonality) {
        var trendStrength = Math.abs(trend);
        var dataQuality = values.length > 10 ? 1 : values.length / 10;
        return (trendStrength * 0.4 + seasonality * 0.4 + dataQuality * 0.2);
    };
    CorrelationAnalyzer.prototype.calculateCorrelation = function (valuesA, valuesB) {
        // Simple correlation calculation for demo
        // In production, use a proper statistical correlation method
        return 0.8;
    };
    CorrelationAnalyzer.prototype.calculateTrend = function (values) {
        // Simple trend calculation for demo
        // In production, use proper trend analysis methods
        return {
            value: 0.5,
            direction: 'up',
            confidence: 0.7
        };
    };
    return CorrelationAnalyzer;
}(events_1.EventEmitter));
exports.CorrelationAnalyzer = CorrelationAnalyzer;
