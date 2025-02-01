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
exports.LandingPageGenerator = void 0;
var FIVERR_SERVICES = {
    marketplace: {
        category: 'General Marketplace',
        trackingLink: 'https://go.fiverr.com/visit/?bta=1064652&brand=fiverrmktplace',
        description: 'Access thousands of digital services'
    },
    pro: {
        category: 'Professional Services',
        trackingLink: 'https://go.fiverr.com/visit/?bta=1064652&brand=fp',
        description: 'Top-tier professional services'
    },
    logoMaker: {
        category: 'Logo Design',
        trackingLink: 'https://go.fiverr.com/visit/?bta=1064652&brand=logomaker',
        description: 'Create your perfect logo'
    }
};
var LandingPageGenerator = /** @class */ (function () {
    function LandingPageGenerator(demandInsights) {
        this.demandInsights = demandInsights;
    }
    LandingPageGenerator.prototype.generateOptimizedPage = function (category) {
        return __awaiter(this, void 0, void 0, function () {
            var service, trends, signals, relevantTrends, relevantSignals, content;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        service = FIVERR_SERVICES[category];
                        if (!service) {
                            throw new Error("Invalid category: ".concat(category));
                        }
                        return [4 /*yield*/, this.demandInsights.getTrends()];
                    case 1:
                        trends = _a.sent();
                        return [4 /*yield*/, this.demandInsights.getLatestSignals()];
                    case 2:
                        signals = _a.sent();
                        relevantTrends = trends.filter(function (trend) {
                            return trend.name.toLowerCase().includes(category.toLowerCase());
                        });
                        relevantSignals = signals.filter(function (signal) {
                            return signal.name.toLowerCase().includes(category.toLowerCase());
                        });
                        content = this.generateContent(service, relevantTrends, relevantSignals);
                        return [2 /*return*/, content];
                }
            });
        });
    };
    LandingPageGenerator.prototype.generateContent = function (service, trends, signals) {
        var trendingFeatures = trends
            .map(function (t) { return t.name; })
            .slice(0, 3)
            .join(', ');
        var html = "\n<!DOCTYPE html>\n<html>\n<head>\n    <title>Top ".concat(service.category, " Services - Limited Time Offer</title>\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n    <style>\n        body {\n            font-family: Arial, sans-serif;\n            line-height: 1.6;\n            margin: 0;\n            padding: 20px;\n            background: #f5f5f5;\n        }\n        .container {\n            max-width: 800px;\n            margin: 0 auto;\n            background: white;\n            padding: 30px;\n            border-radius: 10px;\n            box-shadow: 0 2px 5px rgba(0,0,0,0.1);\n        }\n        .cta-button {\n            display: inline-block;\n            background: #1dbf73;\n            color: white;\n            padding: 15px 30px;\n            text-decoration: none;\n            border-radius: 5px;\n            font-weight: bold;\n            margin: 20px 0;\n        }\n        .features {\n            display: grid;\n            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));\n            gap: 20px;\n            margin: 30px 0;\n        }\n        .feature {\n            padding: 20px;\n            background: #f9f9f9;\n            border-radius: 5px;\n        }\n    </style>\n</head>\n<body>\n    <div class=\"container\">\n        <h1>Premium ").concat(service.category, " Services</h1>\n        <p class=\"highlight\">Trending now: ").concat(trendingFeatures, "</p>\n        \n        <div class=\"features\">\n            <div class=\"feature\">\n                <h3>Expert Providers</h3>\n                <p>Work with top-rated professionals</p>\n            </div>\n            <div class=\"feature\">\n                <h3>Guaranteed Quality</h3>\n                <p>100% satisfaction guarantee</p>\n            </div>\n            <div class=\"feature\">\n                <h3>Fast Delivery</h3>\n                <p>Quick turnaround times</p>\n            </div>\n        </div>\n\n        <p>").concat(service.description, "</p>\n        \n        <a href=\"").concat(service.trackingLink, "\" class=\"cta-button\">\n            Get Started Now\n        </a>\n        \n        <p><small>Limited time offer. Prices subject to change.</small></p>\n    </div>\n</body>\n</html>");
        return html;
    };
    return LandingPageGenerator;
}());
exports.LandingPageGenerator = LandingPageGenerator;
