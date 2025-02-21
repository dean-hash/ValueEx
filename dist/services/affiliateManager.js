"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AffiliateManager = void 0;
const logger_1 = require("../utils/logger");
const revenueTracker_1 = require("./affiliate/revenueTracker");
class AffiliateManager {
    constructor() {
        this.programs = new Map();
        this.revenueTracker = new revenueTracker_1.RevenueTracker();
        // Initialize with real, high-commission AI affiliate programs
        this.addProgram({
            name: 'jasper',
            baseUrl: 'https://jasper.ai',
            affiliateId: process.env.JASPER_AFFILIATE_ID || '',
            commission: 0.3, // 30% commission
            category: 'ai_writing',
        });
        this.addProgram({
            name: 'midjourney',
            baseUrl: 'https://midjourney.com',
            affiliateId: process.env.MIDJOURNEY_AFFILIATE_ID || '',
            commission: 0.2, // 20% commission
            category: 'ai_image',
        });
        this.addProgram({
            name: 'amazon_aws',
            baseUrl: 'https://aws.amazon.com',
            affiliateId: process.env.AWS_AFFILIATE_ID || '',
            commission: 0.1, // 10% first month
            category: 'cloud_ai',
        });
    }
    static getInstance() {
        if (!AffiliateManager.instance) {
            AffiliateManager.instance = new AffiliateManager();
        }
        return AffiliateManager.instance;
    }
    addProgram(program) {
        this.programs.set(program.name, program);
        logger_1.logger.info(`Added affiliate program: ${program.name}`);
    }
    async generateAffiliateLink(url, programName) {
        const program = this.programs.get(programName);
        if (!program) {
            throw new Error(`Affiliate program ${programName} not found`);
        }
        try {
            // Generate real affiliate link based on program
            let affiliateUrl = '';
            if (programName === 'jasper') {
                affiliateUrl = `${url}?fpr=${program.affiliateId}`;
            }
            else if (programName === 'midjourney') {
                affiliateUrl = `${url}?ref=${program.affiliateId}`;
            }
            else if (programName === 'amazon_aws') {
                affiliateUrl = `${url}?tag=${program.affiliateId}`;
            }
            const link = {
                originalUrl: url,
                affiliateUrl,
                program: programName,
                potentialCommission: program.commission,
            };
            // Track potential revenue
            await this.revenueTracker.trackOpportunity({
                source: programName,
                value: program.commission * 100, // Assuming $100 average sale
                probability: 0.05, // 5% conversion rate
                category: program.category,
            });
            return link;
        }
        catch (error) {
            logger_1.logger.error('Error generating affiliate link', error);
            throw error;
        }
    }
    async getActivePrograms() {
        return Array.from(this.programs.values());
    }
    async getRevenueStats() {
        return this.revenueTracker.getStats();
    }
}
exports.AffiliateManager = AffiliateManager;
//# sourceMappingURL=affiliateManager.js.map