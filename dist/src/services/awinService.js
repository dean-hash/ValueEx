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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AwinService = void 0;
var axios_1 = __importDefault(require("axios"));
var logger_1 = require("../utils/logger");
/**
 * Service for interacting with the Awin Affiliate Network API.
 * Handles product search, caching, and data transformation.
 */
var AwinService = /** @class */ (function () {
    /**
     * Creates a new instance of AwinService
     * @param config - Configuration service for API credentials and settings
     * @param cache - Cache service for storing product data
     * @param retryStrategy - Strategy for handling API request retries
     * @param analytics - Analytics service for monitoring cache performance
     */
    function AwinService(config, cache, retryStrategy, analytics) {
        this.config = config;
        this.cache = cache;
        this.retryStrategy = retryStrategy;
        this.analytics = analytics;
        this.baseUrl = 'https://api.awin.com/v2';
        this.US_REGION = '2'; // Awin's region code for US
        this.heartbeatInterval = null;
        this.logger = new logger_1.Logger();
        this.startHeartbeat();
    }
    /**
     * Starts the heartbeat interval for checking Awin API health
     */
    AwinService.prototype.startHeartbeat = function () {
        var _this = this;
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        return setInterval(function () { return _this.checkApiHealth(); }, 300000);
    };
    /**
     * Checks the health of the Awin API
     */
    AwinService.prototype.checkApiHealth = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                try {
                    return [2 /*return*/, axios_1.default.get("".concat(this.baseUrl, "/health"), {
                            headers: this.getHeaders(),
                        })];
                }
                catch (error) {
                    this.logger.error('Awin API health check failed:', error);
                    throw error;
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Returns the headers for Awin API requests, including API key and content type
     * @returns Record of headers for API requests
     */
    AwinService.prototype.getHeaders = function () {
        var apiKey = this.config.get('awin', 'apiKey');
        return {
            Authorization: "Bearer ".concat(apiKey),
            'Content-Type': 'application/json',
        };
    };
    /**
     * Searches for products based on the provided demand pattern
     * @param pattern - The demand pattern containing search criteria
     * @returns Promise of an array of products matching the search criteria
     */
    AwinService.prototype.searchProducts = function (pattern) {
        return __awaiter(this, void 0, void 0, function () {
            var cacheKey, cachedProducts, products, error_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        cacheKey = this.generateCacheKey(pattern);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        return [4 /*yield*/, this.cache.get(cacheKey)];
                    case 2:
                        cachedProducts = _a.sent();
                        if (cachedProducts) {
                            this.analytics.recordHit();
                            return [2 /*return*/, cachedProducts];
                        }
                        this.analytics.recordMiss();
                        return [4 /*yield*/, this.retryStrategy.execute(function () { return __awaiter(_this, void 0, void 0, function () {
                                var response;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, axios_1.default.get("".concat(this.baseUrl, "/products"), {
                                                headers: this.getHeaders(),
                                                params: this.buildSearchParams(pattern),
                                            })];
                                        case 1:
                                            response = _a.sent();
                                            return [2 /*return*/, response.data.products ? this.transformProducts(response.data.products) : []];
                                    }
                                });
                            }); })];
                    case 3:
                        products = _a.sent();
                        return [4 /*yield*/, this.cache.set(cacheKey, products)];
                    case 4:
                        _a.sent();
                        return [2 /*return*/, products];
                    case 5:
                        error_1 = _a.sent();
                        throw new Error("Failed to search products: ".concat(error_1.message));
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Generates a cache key for a given demand pattern
     * @param pattern - The demand pattern containing search criteria
     * @returns A unique cache key string incorporating query and price range
     */
    AwinService.prototype.generateCacheKey = function (pattern) {
        var _a, _b, _c, _d;
        return "awin:".concat(pattern.query, ":").concat(((_b = (_a = pattern.context) === null || _a === void 0 ? void 0 : _a.priceRange) === null || _b === void 0 ? void 0 : _b.min) || '', ":").concat(((_d = (_c = pattern.context) === null || _c === void 0 ? void 0 : _c.priceRange) === null || _d === void 0 ? void 0 : _d.max) || '');
    };
    /**
     * Builds search parameters for the Awin API based on demand pattern
     * @param pattern - The demand pattern containing search criteria
     * @returns Record of search parameters for the API request
     */
    AwinService.prototype.buildSearchParams = function (pattern) {
        var _a;
        var params = {
            keyword: pattern.query,
            region: this.US_REGION,
            merchantCountry: 'US',
            minMerchantRating: '4',
            minCommissionRate: '5',
        };
        if ((_a = pattern.context) === null || _a === void 0 ? void 0 : _a.priceRange) {
            if (pattern.context.priceRange.min !== undefined) {
                params.minPrice = pattern.context.priceRange.min.toString();
            }
            if (pattern.context.priceRange.max !== undefined) {
                params.maxPrice = pattern.context.priceRange.max.toString();
            }
        }
        return params;
    };
    /**
     * Transforms Awin product response data into the internal product format
     * @param products - Array of Awin product response data
     * @returns Array of products in the internal format
     */
    AwinService.prototype.transformProducts = function (products) {
        return products.map(function (p) { return ({
            id: p.productId,
            name: p.productName,
            description: p.description,
            price: p.price,
            merchant: p.merchant,
            url: p.aw_deep_link,
            imageUrl: p.aw_image_url,
            specifications: p.specifications || [],
            resonanceScore: 0,
            resonanceMetrics: {
                harmony: 0,
                impact: 0,
                sustainability: 0,
                innovation: 0,
                localRelevance: 0,
            },
        }); });
    };
    /**
     * Get US merchant recommendations for a domain
     */
    AwinService.prototype.getMerchantRecommendations = function (domain) {
        return __awaiter(this, void 0, void 0, function () {
            var cacheKey, cached, merchants, error_2;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        cacheKey = "merchant:".concat(domain);
                        return [4 /*yield*/, this.cache.get(cacheKey)];
                    case 1:
                        cached = _a.sent();
                        if (cached)
                            return [2 /*return*/, cached];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 5, , 6]);
                        return [4 /*yield*/, this.retryStrategy.execute(function () { return __awaiter(_this, void 0, void 0, function () {
                                var response;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, axios_1.default.get("".concat(this.baseUrl, "/publishers/").concat(this.config.get('awin', 'publisherId'), "/programmes"), {
                                                headers: this.getHeaders(),
                                                params: {
                                                    relationship: 'joined',
                                                    region: this.US_REGION,
                                                },
                                            })];
                                        case 1:
                                            response = _a.sent();
                                            return [2 /*return*/, this.filterAndRankMerchants(response.data, domain)];
                                    }
                                });
                            }); })];
                    case 3:
                        merchants = _a.sent();
                        return [4 /*yield*/, this.cache.set(cacheKey, merchants, 3600)];
                    case 4:
                        _a.sent(); // Cache for 1 hour
                        return [2 /*return*/, merchants];
                    case 5:
                        error_2 = _a.sent();
                        this.logger.error('Failed to get merchant recommendations:', error_2);
                        throw error_2;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    AwinService.prototype.filterAndRankMerchants = function (merchants, domain) {
        return __awaiter(this, void 0, void 0, function () {
            var validMerchants, rankedMerchants;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        validMerchants = merchants.filter(function (m) {
                            return m.isActive &&
                                m.regions.includes(_this.US_REGION) &&
                                m.commissionRate >= 5;
                        });
                        return [4 /*yield*/, Promise.all(validMerchants.map(function (m) { return __awaiter(_this, void 0, void 0, function () {
                                var relevanceScore, recommendedProducts;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, this.calculateRelevance(m, domain)];
                                        case 1:
                                            relevanceScore = _a.sent();
                                            return [4 /*yield*/, this.getTopProducts(m.id)];
                                        case 2:
                                            recommendedProducts = _a.sent();
                                            return [2 /*return*/, {
                                                    merchantId: m.id,
                                                    name: m.name,
                                                    category: m.primaryCategory,
                                                    commissionRate: m.commissionRate,
                                                    relevanceScore: relevanceScore,
                                                    recommendedProducts: recommendedProducts,
                                                }];
                                    }
                                });
                            }); }))];
                    case 1:
                        rankedMerchants = _a.sent();
                        return [2 /*return*/, rankedMerchants
                                .sort(function (a, b) {
                                return (b.commissionRate * b.relevanceScore) - (a.commissionRate * a.relevanceScore);
                            })
                                .slice(0, 10)]; // Top 10 matches
                }
            });
        });
    };
    AwinService.prototype.calculateRelevance = function (merchant, domain) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // TODO: Implement proper relevance calculation
                // For MVP, return 1 if categories match, 0.5 otherwise
                return [2 /*return*/, 1];
            });
        });
    };
    AwinService.prototype.getTopProducts = function (merchantId) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, axios_1.default.get("".concat(this.baseUrl, "/products"), {
                                headers: this.getHeaders(),
                                params: {
                                    merchantId: merchantId,
                                    limit: 5,
                                    sort: 'commission_desc',
                                },
                            })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, this.transformProducts(response.data.products || [])];
                    case 2:
                        error_3 = _a.sent();
                        this.logger.error("Failed to get products for merchant ".concat(merchantId, ":"), error_3);
                        return [2 /*return*/, []];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return AwinService;
}());
exports.AwinService = AwinService;
