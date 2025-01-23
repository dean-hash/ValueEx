"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AwinClient = void 0;
const axios_1 = __importDefault(require("axios"));
class AwinClient {
    constructor(apiKey) {
        this.baseUrl = 'https://api.awin.com';
        this.apiKey = apiKey;
        this.publisherId = process.env.AWIN_PUBLISHER_ID || '';
    }
    async getHighValuePrograms() {
        const response = await axios_1.default.get(`${this.baseUrl}/publishers/${this.publisherId}/programmes`, {
            headers: {
                Authorization: `Bearer ${this.apiKey}`,
            },
            params: {
                relationship: 'joined',
                orderBy: 'commissionRate',
                orderDirection: 'desc',
            },
        });
        // Filter for AI/Tech products with high commission
        return response.data.filter((program) => {
            const isAITech = program.category.toLowerCase().includes('tech') ||
                program.description.toLowerCase().includes('ai') ||
                program.description.toLowerCase().includes('intelligence');
            const hasGoodCommission = program.commissionRate > 20; // 20% or higher
            return isAITech && hasGoodCommission;
        });
    }
    async getCommissionDetails(programId) {
        return axios_1.default.get(`${this.baseUrl}/publishers/${this.publisherId}/commissiongroups`, {
            headers: {
                Authorization: `Bearer ${this.apiKey}`,
            },
            params: {
                programmeId: programId,
            },
        });
    }
    async trackOpportunity(programId, metadata) {
        // Store opportunity tracking info for ValueEx
        // We'll expand this as we build out the matching system
    }
}
exports.AwinClient = AwinClient;
//# sourceMappingURL=awinClient.js.map