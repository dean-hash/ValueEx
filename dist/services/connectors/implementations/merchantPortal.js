"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MerchantPortal = void 0;
const merchant_1 = require("../../../core/api/merchant");
const productEngine_1 = require("../../matching/productEngine");
class MerchantPortal {
    constructor() {
        this.api = new merchant_1.DirectMerchantAPI();
        this.matchingEngine = new productEngine_1.ProductMatchingEngine();
    }
    static getInstance() {
        if (!MerchantPortal.instance) {
            MerchantPortal.instance = new MerchantPortal();
        }
        return MerchantPortal.instance;
    }
    async getOptimalProducts(context = {}) {
        const products = await this.api.getProducts();
        return this.matchingEngine.findOptimalMatches(products, context);
    }
    async trackEngagement(data) {
        await this.api.trackEngagement(data);
    }
    async processConversion(conversionData) {
        return this.api.recordConversion(conversionData);
    }
}
exports.MerchantPortal = MerchantPortal;
//# sourceMappingURL=merchantPortal.js.map