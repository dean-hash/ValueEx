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
exports.ProfitablePrograms = void 0;
var affiliateConnector_1 = require("./affiliateConnector");
var ProfitablePrograms = /** @class */ (function () {
    function ProfitablePrograms() {
        this.connector = affiliateConnector_1.AffiliateConnector.getInstance();
    }
    ProfitablePrograms.getInstance = function () {
        if (!ProfitablePrograms.instance) {
            ProfitablePrograms.instance = new ProfitablePrograms();
        }
        return ProfitablePrograms.instance;
    };
    ProfitablePrograms.prototype.getTopAwinPrograms = function () {
        return __awaiter(this, arguments, void 0, function (limit) {
            var programs, programMetrics;
            var _this = this;
            if (limit === void 0) { limit = 10; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.connector.getAwinPrograms()];
                    case 1:
                        programs = _a.sent();
                        programMetrics = programs
                            .filter(function (program) { return program.status === 'Active'; })
                            .map(function (program) { return ({
                            id: program.id,
                            name: program.name,
                            sector: program.primarySector,
                            commission: program.commission,
                            conversionRate: program.conversionRate || 0.02, // Default 2%
                            averageOrder: program.averageOrder || _this.getAverageOrderByIndustry(program.primarySector),
                            expectedValue: (program.commission / 100) * (program.averageOrder || _this.getAverageOrderByIndustry(program.primarySector))
                        }); })
                            .filter(function (program) { return program.commission > 0; });
                        // Sort by expected value and return top N
                        return [2 /*return*/, programMetrics
                                .sort(function (a, b) { return b.expectedValue - a.expectedValue; })
                                .slice(0, limit)];
                }
            });
        });
    };
    ProfitablePrograms.prototype.getAverageOrderByIndustry = function (sector) {
        var averages = {
            'Health & Beauty': 75,
            'Clothing': 100,
            'Electronics': 200,
            'Home & Garden': 150,
            'Business Services': 500,
            'Education & Training': 300,
            'Software & Technology': 250,
            'Financial Services': 1000,
            'Travel': 800,
            'Sports & Fitness': 120
        };
        return averages[sector] || 100; // Default to $100 if sector not found
    };
    ProfitablePrograms.prototype.getFiverrServiceMatches = function (program) {
        var fiverrLinks = this.connector.getFiverrLinks();
        var matches = [];
        // Map business sectors to relevant Fiverr services
        var sectorMatches = {
            'Business Services': [
                { type: 'pro', relevance: 0.9 },
                { type: 'marketplace', relevance: 0.8 }
            ],
            'Software & Technology': [
                { type: 'pro', relevance: 0.95 },
                { type: 'marketplace', relevance: 0.85 }
            ],
            'Marketing & Advertising': [
                { type: 'pro', relevance: 0.9 },
                { type: 'marketplace', relevance: 0.8 }
            ],
            'Creative & Design': [
                { type: 'logo', relevance: 0.95 },
                { type: 'marketplace', relevance: 0.9 }
            ]
        };
        // Add sector-specific matches
        if (program.sector in sectorMatches) {
            sectorMatches[program.sector].forEach(function (match) {
                var link = match.type === 'pro' ? fiverrLinks.pro :
                    match.type === 'logo' ? fiverrLinks.logoMaker :
                        fiverrLinks.marketplace;
                matches.push({
                    keyword: "".concat(program.sector, " services"),
                    fiverrLink: link,
                    relevance: match.relevance
                });
            });
        }
        // Always add marketplace as a fallback
        if (!matches.length) {
            matches.push({
                keyword: 'general services',
                fiverrLink: fiverrLinks.marketplace,
                relevance: 0.7
            });
        }
        return matches.sort(function (a, b) { return b.relevance - a.relevance; });
    };
    ProfitablePrograms.prototype.generateRevenueOpportunities = function () {
        return __awaiter(this, void 0, void 0, function () {
            var topPrograms, opportunities, error_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.getTopAwinPrograms(5)];
                    case 1:
                        topPrograms = _a.sent();
                        console.log('Top Awin Programs:', topPrograms);
                        opportunities = topPrograms.map(function (program) {
                            var fiverrMatches = _this.getFiverrServiceMatches(program);
                            return {
                                program: program,
                                fiverrMatches: fiverrMatches,
                                totalOpportunity: program.expectedValue * Math.max.apply(Math, fiverrMatches.map(function (m) { return m.relevance; }))
                            };
                        });
                        return [2 /*return*/, opportunities.sort(function (a, b) { return b.totalOpportunity - a.totalOpportunity; })];
                    case 2:
                        error_1 = _a.sent();
                        console.error('Error generating revenue opportunities:', error_1);
                        throw error_1;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return ProfitablePrograms;
}());
exports.ProfitablePrograms = ProfitablePrograms;
