"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AwinConnector = void 0;
const axios_1 = __importDefault(require("axios"));
class AwinConnector {
    constructor() {
        this.merchantId = '7777';
        this.baseUrl = 'https://api.awin.com/publishers';
        this.apiKey = process.env.AWIN_API_KEY || '';
        this.publisherId = process.env.AWIN_PUBLISHER_ID || '';
    }
    static getInstance() {
        if (!AwinConnector.instance) {
            AwinConnector.instance = new AwinConnector();
        }
        return AwinConnector.instance;
    }
    async getHighValueProducts() {
        const response = await axios_1.default.get(`${this.baseUrl}/${this.publisherId}/products`, {
            headers: {
                Authorization: `Bearer ${this.apiKey}`,
                'X-Merchant-Id': this.merchantId,
            },
        });
        return response.data.products
            .filter((p) => p.status === 'active' && p.commissionRate >= 25)
            .map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            commissionRate: p.commissionRate,
            price: p.price,
            category: p.category,
            merchantName: 'ValueEx',
            deepLink: this.generateTrackingLink(p.id),
        }));
    }
    generateTrackingLink(productId) {
        return `https://track.network/click/${this.merchantId}/${productId}`;
    }
    async trackConversion(productId, saleAmount) {
        await axios_1.default.post(`${this.baseUrl}/${this.publisherId}/conversions`, {
            productId,
            amount: saleAmount,
            timestamp: new Date().toISOString(),
        }, {
            headers: {
                Authorization: `Bearer ${this.apiKey}`,
                'X-Merchant-Id': this.merchantId,
            },
        });
    }
    async getHighPayingPrograms() {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/${this.publisherId}/programmes`, {
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                },
                params: {
                    relationship: 'joined',
                    orderBy: 'commission',
                },
            });
            return response.data
                .filter((program) => program.commissionRange.max >= 30 && // 30% or higher commission
                program.paymentStatus === 'active' && // Currently paying
                program.validationPeriod <= 7 // Quick validation
            )
                .sort((a, b) => b.commissionRange.max - a.commissionRange.max);
        }
        catch (error) {
            console.error('Error fetching Awin programs:', error);
            return [];
        }
    }
    async getCommissionsDue() {
        try {
            const now = new Date();
            const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
            const response = await axios_1.default.get(`${this.baseUrl}/${this.publisherId}/transactions`, {
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                },
                params: {
                    startDate: thirtyDaysAgo.toISOString(),
                    endDate: new Date().toISOString(),
                    status: 'pending',
                },
            });
            return {
                totalDue: response.data.reduce((sum, tx) => sum + tx.commission, 0),
                transactions: response.data,
            };
        }
        catch (error) {
            console.error('Error fetching Awin commissions:', error);
            return { totalDue: 0, transactions: [] };
        }
    }
    async generateHighValueLinks() {
        const products = await this.getHighPayingPrograms();
        return products.map((product) => `https://www.awin1.com/cread.php?awinmid=${this.merchantId}&awinaffid=${this.publisherId}&clickref=high_value&p=${product.id}`);
    }
    async getActiveCommissions() {
        const response = await axios_1.default.get(`${this.baseUrl}/${this.publisherId}/commissions`, {
            headers: {
                Authorization: `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
            },
        });
        return response.data.totalAmount || 0;
    }
    async optimizeCommissions() {
        const products = await this.getHighPayingPrograms();
        // Focus on highest commission products
        const optimizedProducts = products
            .filter((p) => p.commissionRate >= 0.25)
            .sort((a, b) => b.commissionRate - a.commissionRate);
        // Generate optimized tracking links
        const links = optimizedProducts.map((product) => ({
            url: `https://www.awin1.com/cread.php?awinmid=${this.merchantId}&awinaffid=${this.publisherId}&clickref=optimized&p=${product.id}`,
            rate: product.commissionRate,
            value: product.price * product.commissionRate,
        }));
        console.log('Optimized Commission Opportunities:');
        links.forEach((link) => {
            console.log(`\nCommission Rate: ${(link.rate * 100).toFixed(1)}%`);
            console.log(`Potential Value: $${link.value.toFixed(2)}`);
            console.log(`Tracking URL: ${link.url}`);
        });
    }
}
exports.AwinConnector = AwinConnector;
//# sourceMappingURL=awinConnector.js.map