"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntelligenceEnhancer = void 0;
var IntelligenceEnhancer = /** @class */ (function () {
    function IntelligenceEnhancer(logger) {
        this.logger = logger;
        this.metrics = {
            enhancedCount: 0,
            avgProcessingTime: 0,
            avgConfidence: 0
        };
    }
    IntelligenceEnhancer.prototype.enhance = function (signal, insights, context) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, _a, processedSignal, enhancedInsights, enhancedContext, processingTime, error_1;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, , 3]);
                        startTime = Date.now();
                        return [4 /*yield*/, Promise.all([
                                this.processSignal(signal),
                                this.processInsights(insights),
                                this.processContext(context)
                            ])];
                    case 1:
                        _a = _c.sent(), processedSignal = _a[0], enhancedInsights = _a[1], enhancedContext = _a[2];
                        processingTime = Date.now() - startTime;
                        this.updateMetrics(processingTime, ((_b = processedSignal.metadata) === null || _b === void 0 ? void 0 : _b.confidence) || 0);
                        return [2 /*return*/, {
                                signal: processedSignal,
                                insights: enhancedInsights,
                                context: enhancedContext
                            }];
                    case 2:
                        error_1 = _c.sent();
                        this.logger.error('Error enhancing intelligence:', error_1);
                        throw error_1;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    IntelligenceEnhancer.prototype.extractKeywords = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var words, frequency;
            return __generator(this, function (_a) {
                if (!context || typeof context !== 'string') {
                    return [2 /*return*/, []];
                }
                words = context.toLowerCase().split(/\W+/);
                frequency = {};
                words.forEach(function (word) {
                    if (word.length > 3) {
                        frequency[word] = (frequency[word] || 0) + 1;
                    }
                });
                // Return top 5 most frequent words as keywords
                return [2 /*return*/, Object.entries(frequency)
                        .sort(function (_a, _b) {
                        var a = _a[1];
                        var b = _b[1];
                        return b - a;
                    })
                        .slice(0, 5)
                        .map(function (_a) {
                        var word = _a[0];
                        return word;
                    })];
            });
        });
    };
    IntelligenceEnhancer.prototype.processInsights = function (insights) {
        return __awaiter(this, void 0, void 0, function () {
            var enhancedInsights, _a;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, this.enhanceInsights(insights)];
                    case 1:
                        enhancedInsights = _c.sent();
                        _a = [__assign({}, enhancedInsights)];
                        _b = { confidence: this.calculateConfidence(enhancedInsights), relevance: this.calculateRelevance(enhancedInsights) };
                        return [4 /*yield*/, this.extractKeywords(enhancedInsights.context || '')];
                    case 2: return [2 /*return*/, __assign.apply(void 0, _a.concat([(_b.keywords = _c.sent(), _b)]))];
                }
            });
        });
    };
    IntelligenceEnhancer.prototype.enhanceInsights = function (insights) {
        return __awaiter(this, void 0, void 0, function () {
            var confidence, relevance, keywords, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!insights) {
                            throw new Error('Insights are required for enhancement');
                        }
                        confidence = Math.min((insights.confidence || 0.5) * 1.2, 1);
                        relevance = Math.min((insights.relevance || 0.5) * 1.1, 1);
                        if (!insights.context) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.extractKeywords(insights.context)];
                    case 1:
                        _a = _b.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        _a = [];
                        _b.label = 3;
                    case 3:
                        keywords = _a;
                        // Return enhanced insights
                        return [2 /*return*/, __assign(__assign({}, insights), { confidence: confidence, relevance: relevance, keywords: __spreadArray([], new Set(__spreadArray(__spreadArray([], (insights.keywords || []), true), keywords, true)), true), valueEvidence: this.validateValueEvidence(insights), urgency: this.calculateUrgency(insights) })];
                }
            });
        });
    };
    IntelligenceEnhancer.prototype.calculateConfidence = function (insights) {
        return Math.min(((insights.confidence || 0.5) +
            (insights.relevance || 0.5)) / 2 * 1.2, 1);
    };
    IntelligenceEnhancer.prototype.calculateRelevance = function (insights) {
        return Math.min(((insights.relevance || 0.5) +
            (insights.valueEvidence ? 0.2 : 0)) * 1.1, 1);
    };
    IntelligenceEnhancer.prototype.processContext = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var enhancedContext;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.enhanceContext(context)];
                    case 1:
                        enhancedContext = _a.sent();
                        return [2 /*return*/, __assign(__assign({}, enhancedContext), { authenticityScore: this.calculateAuthenticityScore(enhancedContext), valueValidation: __assign(__assign({}, enhancedContext.valueValidation), { evidenceStrength: this.calculateEvidenceStrength(enhancedContext) }) })];
                }
            });
        });
    };
    IntelligenceEnhancer.prototype.enhanceContext = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var authenticityScore, evidenceStrength;
            var _a;
            return __generator(this, function (_b) {
                if (!context) {
                    throw new Error('Context is required for enhancement');
                }
                authenticityScore = this.calculateAuthenticityScore(context);
                evidenceStrength = this.calculateEvidenceStrength(context);
                // Return enhanced context with updated validation
                return [2 /*return*/, __assign(__assign({}, context), { authenticityScore: authenticityScore, valueValidation: __assign(__assign({}, context.valueValidation), { evidenceStrength: evidenceStrength, confidence: Math.min((((_a = context.valueValidation) === null || _a === void 0 ? void 0 : _a.confidence) || 0.5) * 1.2, 1) }) })];
            });
        });
    };
    IntelligenceEnhancer.prototype.calculateAuthenticityScore = function (context) {
        if (!context.valueValidation) {
            return 0.5;
        }
        var baseScore = context.valueValidation.evidenceStrength || 0.5;
        var multiplier = context.valueValidation.confidence ? 1.2 : 1.0;
        return Math.min(baseScore * multiplier, 1);
    };
    IntelligenceEnhancer.prototype.calculateEvidenceStrength = function (context) {
        if (!context.valueValidation) {
            return 0.5;
        }
        var baseStrength = context.valueValidation.confidence || 0.5;
        var multiplier = context.authenticityScore ? 1.2 : 1.0;
        return Math.min(baseStrength * multiplier, 1);
    };
    IntelligenceEnhancer.prototype.processSignal = function (signal) {
        return __awaiter(this, void 0, void 0, function () {
            var processingTime, confidence, keywords;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!signal) {
                            throw new Error('Signal is required for processing');
                        }
                        processingTime = Date.now() - (((_a = signal.metadata) === null || _a === void 0 ? void 0 : _a.timestamp) || Date.now());
                        confidence = this.calculateSignalConfidence(signal);
                        return [4 /*yield*/, this.extractKeywords(signal.content || '')];
                    case 1:
                        keywords = _c.sent();
                        return [2 /*return*/, __assign(__assign({}, signal), { metadata: __assign(__assign({}, signal.metadata), { confidence: confidence, processingTime: processingTime, keywords: keywords, strength: this.calculateSignalStrength({
                                        confidence: confidence,
                                        relevance: ((_b = signal.metadata) === null || _b === void 0 ? void 0 : _b.relevance) || 0.5,
                                        keywords: keywords
                                    }) }) })];
                }
            });
        });
    };
    IntelligenceEnhancer.prototype.calculateSignalConfidence = function (signal) {
        var _a, _b;
        var baseConfidence = ((_a = signal.metadata) === null || _a === void 0 ? void 0 : _a.confidence) || 0.5;
        var relevance = ((_b = signal.metadata) === null || _b === void 0 ? void 0 : _b.relevance) || 0.5;
        return Math.min((baseConfidence + relevance) / 2, 1);
    };
    IntelligenceEnhancer.prototype.calculateSignalStrength = function (insights) {
        var _a;
        var baseStrength = (insights.confidence || 0.5) + (insights.relevance || 0.5);
        var keywordBonus = ((_a = insights.keywords) === null || _a === void 0 ? void 0 : _a.length) ? 0.1 : 0;
        return Math.min(baseStrength / 2 + keywordBonus, 1);
    };
    IntelligenceEnhancer.prototype.validateValueEvidence = function (insights) {
        if (!insights.valueEvidence) {
            return {
                strength: 0.5,
                confidence: 0.5,
                sources: []
            };
        }
        return __assign(__assign({}, insights.valueEvidence), { strength: Math.min((insights.valueEvidence.strength || 0.5) * 1.2, 1), confidence: Math.min((insights.valueEvidence.confidence || 0.5) * 1.1, 1) });
    };
    IntelligenceEnhancer.prototype.calculateUrgency = function (insights) {
        var baseUrgency = insights.urgency || 0.5;
        var multiplier = insights.confidence ? 1.2 : 1.0;
        return Math.min(baseUrgency * multiplier, 1);
    };
    IntelligenceEnhancer.prototype.updateMetrics = function (processingTime, confidence) {
        this.metrics.enhancedCount++;
        this.metrics.avgProcessingTime =
            (this.metrics.avgProcessingTime * (this.metrics.enhancedCount - 1) + processingTime) /
                this.metrics.enhancedCount;
        this.metrics.avgConfidence =
            (this.metrics.avgConfidence * (this.metrics.enhancedCount - 1) + confidence) /
                this.metrics.enhancedCount;
    };
    IntelligenceEnhancer.prototype.getMetrics = function () {
        return __assign({}, this.metrics);
    };
    return IntelligenceEnhancer;
}());
exports.IntelligenceEnhancer = IntelligenceEnhancer;
