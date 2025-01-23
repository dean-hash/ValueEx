"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AwinService = void 0;
class AwinService {
    constructor(config, cache, retry, analytics) {
        this.config = config;
        this.cache = cache;
        this.retry = retry;
        this.analytics = analytics;
    }
    async getMerchants() {
        // Mock data for testing
        return [
            {
                name: 'Digital Learning Hub',
                networkId: 'edu_001',
                merchantId: 'dlh_001',
                categories: ['education', 'online_courses', 'professional_development'],
                averageCommission: 45,
                conversionRate: 0.08,
                validationStatus: 'approved',
                performance: { reliability: 0.92 },
                services: [
                    { name: 'Technical Certification', value: 299 },
                    { name: 'Business Skills', value: 199 },
                    { name: 'Language Learning', value: 149 },
                ],
                commissionStructure: { base: 45, notes: 'Volume bonuses available' },
                status: 'active',
                notes: 'Strong in digital education sector',
            },
            {
                name: 'Creative Market Pro',
                networkId: 'creative_001',
                merchantId: 'cmp_001',
                categories: ['digital_assets', 'design_tools', 'creative'],
                averageCommission: 35,
                conversionRate: 0.12,
                validationStatus: 'approved',
                performance: { reliability: 0.88 },
                services: [
                    { name: 'Stock Photos', value: 79 },
                    { name: 'Vector Graphics', value: 59 },
                    { name: 'Font Collections', value: 39 },
                ],
                commissionStructure: { base: 35, notes: 'Tiered commission structure' },
                status: 'active',
                notes: 'Leading digital asset marketplace',
            },
            {
                name: 'Tech Gear Direct',
                networkId: 'tech_001',
                merchantId: 'tgd_001',
                categories: ['electronics', 'gadgets', 'accessories'],
                averageCommission: 25,
                conversionRate: 0.06,
                validationStatus: 'approved',
                performance: { reliability: 0.85 },
                services: [
                    { name: 'Smart Home Devices', value: 199 },
                    { name: 'Mobile Accessories', value: 49 },
                    { name: 'Gaming Peripherals', value: 129 },
                ],
                commissionStructure: { base: 25, notes: 'Fixed rate commission' },
                status: 'active',
                notes: 'Specialized in premium tech accessories',
            },
        ];
    }
    async generateAffiliateLink(merchantId) {
        // In real implementation, this would call Awin's API
        return `https://www.awin1.com/cread.php?merchantId=${merchantId}&platform=dl`;
    }
}
exports.AwinService = AwinService;
//# sourceMappingURL=awinService.js.map