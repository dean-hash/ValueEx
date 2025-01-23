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
exports.ResonanceFieldService = void 0;
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var intelligenceEnhancer_1 = require("./intelligence/intelligenceEnhancer");
var ResonanceFieldService = /** @class */ (function () {
    function ResonanceFieldService() {
        var _this = this;
        var initialState = {
            vectors: {
                supply: [],
                demand: [],
            },
            coherence: 0,
            intensity: 0,
            confidence: 0,
        };
        this.supplyField = new rxjs_1.BehaviorSubject(initialState);
        this.demandField = new rxjs_1.BehaviorSubject(initialState);
        this.intelligenceEnhancer = intelligenceEnhancer_1.IntelligenceEnhancer.getInstance();
        this.resonanceState = new rxjs_1.BehaviorSubject({
            coherence: 0,
            intensity: 0,
            confidence: 0,
        });
        (0, rxjs_1.combineLatest)([this.supplyField, this.demandField])
            .pipe((0, operators_1.map)(function (_a) {
            var supply = _a[0], demand = _a[1];
            return _this.calculateResonance(supply, demand);
        }))
            .subscribe(function (resonance) { return _this.resonanceState.next(resonance); });
    }
    ResonanceFieldService.getInstance = function () {
        if (!ResonanceFieldService.instance) {
            ResonanceFieldService.instance = new ResonanceFieldService();
        }
        return ResonanceFieldService.instance;
    };
    ResonanceFieldService.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    ResonanceFieldService.prototype.getCurrentState = function () {
        return {
            patterns: [],
            metrics: {
                coherence: this.resonanceState.value.coherence,
                intensity: this.resonanceState.value.intensity,
                confidence: this.resonanceState.value.confidence,
            },
        };
    };
    ResonanceFieldService.prototype.observePatterns = function () {
        return this.resonanceState.pipe((0, operators_1.map)(function (metrics) { return ({
            id: Date.now().toString(),
            type: 'resonance',
            metrics: metrics,
            timestamp: new Date().toISOString(),
        }); }));
    };
    ResonanceFieldService.prototype.calculateResonance = function (supply, demand) {
        var supplyVectors = supply.vectors.supply;
        var demandVectors = demand.vectors.demand;
        if (!supplyVectors.length || !demandVectors.length) {
            return {
                coherence: 0,
                intensity: 0,
                confidence: 0,
            };
        }
        var coherence = this.calculateCoherence(supplyVectors, demandVectors);
        var intensity = this.calculateIntensity(supplyVectors, demandVectors);
        var confidence = this.calculateConfidence(supplyVectors, demandVectors);
        return {
            coherence: coherence,
            intensity: intensity,
            confidence: confidence,
        };
    };
    ResonanceFieldService.prototype.calculateCoherence = function (supply, demand) {
        var totalCoherence = 0;
        var count = 0;
        for (var _i = 0, supply_1 = supply; _i < supply_1.length; _i++) {
            var supplyVector = supply_1[_i];
            for (var _a = 0, demand_1 = demand; _a < demand_1.length; _a++) {
                var demandVector = demand_1[_a];
                if (supplyVector.dimension === demandVector.dimension) {
                    var dotProduct = this.calculateDotProduct(supplyVector.direction, demandVector.direction);
                    var contextSimilarity = this.calculateContextSimilarity(supplyVector.context, demandVector.context);
                    totalCoherence += Math.abs(dotProduct) * contextSimilarity;
                    count++;
                }
            }
        }
        return count > 0 ? totalCoherence / count : 0;
    };
    ResonanceFieldService.prototype.calculateIntensity = function (supply, demand) {
        var supplyIntensity = supply.reduce(function (sum, vector) { return sum + vector.magnitude; }, 0) / supply.length;
        var demandIntensity = demand.reduce(function (sum, vector) { return sum + vector.magnitude; }, 0) / demand.length;
        return (supplyIntensity + demandIntensity) / 2;
    };
    ResonanceFieldService.prototype.calculateConfidence = function (supply, demand) {
        var supplyStrength = supply.reduce(function (sum, vector) { return sum + vector.strength; }, 0) / supply.length;
        var demandStrength = demand.reduce(function (sum, vector) { return sum + vector.strength; }, 0) / demand.length;
        return (supplyStrength + demandStrength) / 2;
    };
    ResonanceFieldService.prototype.calculateDotProduct = function (v1, v2) {
        return v1.reduce(function (sum, val, i) { return sum + val * (v2[i] || 0); }, 0);
    };
    ResonanceFieldService.prototype.calculateContextSimilarity = function (context1, context2) {
        var set1 = new Set(context1.map(function (s) { return s.toLowerCase(); }));
        var set2 = new Set(context2.map(function (s) { return s.toLowerCase(); }));
        var intersection = new Set(__spreadArray([], set1, true).filter(function (x) { return set2.has(x); }));
        var union = new Set(__spreadArray(__spreadArray([], set1, true), set2, true));
        return intersection.size / union.size;
    };
    ResonanceFieldService.prototype.addSupplyVector = function (vector) {
        var currentState = this.supplyField.getValue();
        var updatedVectors = __spreadArray(__spreadArray([], currentState.vectors.supply, true), [vector], false);
        this.supplyField.next(__assign(__assign({}, currentState), { vectors: __assign(__assign({}, currentState.vectors), { supply: updatedVectors }) }));
    };
    ResonanceFieldService.prototype.addDemandVector = function (vector) {
        var currentState = this.demandField.getValue();
        var updatedVectors = __spreadArray(__spreadArray([], currentState.vectors.demand, true), [vector], false);
        this.demandField.next(__assign(__assign({}, currentState), { vectors: __assign(__assign({}, currentState.vectors), { demand: updatedVectors }) }));
    };
    ResonanceFieldService.prototype.addDemandSignal = function (signal) {
        return __awaiter(this, void 0, void 0, function () {
            var demandVectors;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.intelligenceEnhancer.enhanceDemandContext(signal)];
                    case 1:
                        demandVectors = _a.sent();
                        demandVectors.forEach(function (vector) { return _this.addDemandVector(vector); });
                        return [2 /*return*/];
                }
            });
        });
    };
    ResonanceFieldService.prototype.addProduct = function (product) {
        return __awaiter(this, void 0, void 0, function () {
            var productVectors;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.intelligenceEnhancer.enhanceProductUnderstanding(product)];
                    case 1:
                        productVectors = _a.sent();
                        productVectors.forEach(function (vector) { return _this.addSupplyVector(vector); });
                        return [2 /*return*/];
                }
            });
        });
    };
    ResonanceFieldService.prototype.getResonanceState = function () {
        return this.resonanceState.getValue();
    };
    ResonanceFieldService.prototype.calculateProductResonance = function (product, signal) {
        return __awaiter(this, void 0, void 0, function () {
            var productVectors, demandVectors, resonance;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.intelligenceEnhancer.enhanceProductUnderstanding(product)];
                    case 1:
                        productVectors = _a.sent();
                        return [4 /*yield*/, this.intelligenceEnhancer.enhanceDemandPattern(signal)];
                    case 2:
                        demandVectors = _a.sent();
                        // Reset the fields
                        this.supplyField.next({
                            vectors: { supply: [], demand: [] },
                            coherence: 0,
                            intensity: 0,
                            confidence: 0,
                        });
                        this.demandField.next({
                            vectors: { supply: [], demand: [] },
                            coherence: 0,
                            intensity: 0,
                            confidence: 0,
                        });
                        // Add the new vectors
                        productVectors.vectors.forEach(function (vector) { return _this.addSupplyVector(vector); });
                        demandVectors.vectors.forEach(function (vector) { return _this.addDemandVector(vector); });
                        resonance = this.getResonanceState();
                        return [2 /*return*/, (resonance.coherence + resonance.intensity + resonance.confidence) / 3];
                }
            });
        });
    };
    return ResonanceFieldService;
}());
exports.ResonanceFieldService = ResonanceFieldService;
