"use strict";
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
exports.ValueCreationService = void 0;
var logger_1 = require("../utils/logger");
/**
 * Service for measuring and optimizing real-time value creation across all participants
 * Integrates directly with Dynamics 365 and Business Central for accurate metrics
 */
var ValueCreationService = /** @class */ (function () {
    function ValueCreationService(resonanceField, awinService, dynamicsService, bcService) {
        this.resonanceField = resonanceField;
        this.awinService = awinService;
        this.CACHE_TTL = 5 * 60 * 1000; // 5 minutes
        this.logger = new logger_1.Logger();
        this.dynamicsService = dynamicsService;
        this.bcService = bcService;
        this.cache = new Map();
    }
    /**
     * Calculate value creation for all parties in a potential match
     */
    ValueCreationService.prototype.measureValueCreation = function (product, pattern) {
        return __awaiter(this, void 0, void 0, function () {
            var cacheKey, cached, metrics, _a, efficiencyMetrics, affiliateMetrics, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        cacheKey = this.getCacheKey(product, pattern);
                        cached = this.cache.get(cacheKey);
                        if (cached && this.isCacheValid(cached.timestamp)) {
                            return [2 /*return*/, cached.data];
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, this.resonanceField.measureValueCreation(product, pattern)];
                    case 2:
                        metrics = _b.sent();
                        return [4 /*yield*/, Promise.all([
                                this.bcService.getEfficiencyMetrics(),
                                this.awinService.getAffiliateMetrics()
                            ])];
                    case 3:
                        _a = _b.sent(), efficiencyMetrics = _a[0], affiliateMetrics = _a[1];
                        metrics.realTimeMetrics = {
                            revenue: affiliateMetrics.revenue,
                            costs: efficiencyMetrics.costPerLead * affiliateMetrics.conversions,
                            profitMargin: (affiliateMetrics.revenue - affiliateMetrics.commission) / affiliateMetrics.revenue,
                            customerEngagement: affiliateMetrics.conversions / affiliateMetrics.clicks
                        };
                        this.cache.set(cacheKey, { data: metrics, timestamp: new Date() });
                        return [2 /*return*/, metrics];
                    case 4:
                        error_1 = _b.sent();
                        this.logger.error('Error measuring value creation:', error_1);
                        throw error_1;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Calculate the value match between consumer intent and product
     */
    ValueCreationService.prototype.calculateIntentMatchValue = function (product, pattern, signals) {
        return __awaiter(this, void 0, void 0, function () {
            var consumerValue, merchantValue, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.resonanceField.calculateConsumerValue(product, pattern, signals)];
                    case 1:
                        consumerValue = _a.sent();
                        return [4 /*yield*/, this.resonanceField.calculateMerchantValue(product, signals)];
                    case 2:
                        merchantValue = _a.sent();
                        // Weighted average of consumer and merchant value
                        return [2 /*return*/, (consumerValue * 0.6 + merchantValue * 0.4)];
                    case 3:
                        error_2 = _a.sent();
                        this.logger.error('Error calculating intent match value:', error_2);
                        throw error_2;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    ValueCreationService.prototype.getCacheKey = function (product, pattern) {
        return "".concat(product.id, "-").concat(pattern.id);
    };
    ValueCreationService.prototype.isCacheValid = function (timestamp) {
        return Date.now() - timestamp.getTime() < this.CACHE_TTL;
    };
    return ValueCreationService;
}());
exports.ValueCreationService = ValueCreationService;
