"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleServicesManager = void 0;
const dynamics365_1 = require("../../integrations/dynamics365");
const businessCentral_1 = require("../../integrations/businessCentral");
class GoogleServicesManager {
    constructor() {
        this.dynamics = new dynamics365_1.DynamicsService();
        this.bc = new businessCentral_1.BusinessCentralService();
        this.services = new Map();
        this.initializeServices();
    }
    initializeServices() {
        // AI & ML Services
        this.addService({
            name: 'Vertex AI',
            type: 'Platform',
            status: 'Active',
            cost: { type: 'Paid' }
        });
        this.addService({
            name: 'PaLM API',
            type: 'API',
            status: 'Active',
            cost: { type: 'Paid' }
        });
        // Cloud Services
        this.addService({
            name: 'Google Cloud Platform',
            type: 'Platform',
            status: 'Active',
            cost: { type: 'Paid' }
        });
        // Workspace
        this.addService({
            name: 'Google Workspace',
            type: 'Platform',
            status: 'Active',
            cost: { type: 'Enterprise' }
        });
        // Development Tools
        this.addService({
            name: 'Firebase',
            type: 'Platform',
            status: 'Active',
            cost: { type: 'Paid' }
        });
    }
    addService(service) {
        this.services.set(service.name, service);
        this.trackInBusinessSystems(service);
    }
    async trackInBusinessSystems(service) {
        // Track in Dynamics 365
        await this.dynamics.createProduct({
            name: service.name,
            type: 'Service',
            vendor: 'Google',
            status: service.status
        });
        // Track in Business Central
        if (service.cost.type !== 'Free') {
            await this.bc.createVendorService({
                name: service.name,
                vendor: 'Google',
                monthlyCost: service.cost.monthlyEstimate || 0,
                category: 'Cloud Services'
            });
        }
    }
    async getActiveServices() {
        return Array.from(this.services.values())
            .filter(service => service.status === 'Active');
    }
    async getCostAnalysis() {
        const breakdown = {};
        let total = 0;
        for (const service of this.services.values()) {
            if (service.cost.monthlyEstimate) {
                breakdown[service.name] = service.cost.monthlyEstimate;
                total += service.cost.monthlyEstimate;
            }
        }
        return {
            totalMonthlyCost: total,
            serviceBreakdown: breakdown
        };
    }
    async optimizeServices() {
        const analysis = await this.getCostAnalysis();
        const recommendations = [];
        let potentialSavings = 0;
        // Analyze usage patterns and suggest optimizations
        // This would integrate with actual usage data from GCP
        return {
            recommendations,
            potentialSavings
        };
    }
}
exports.GoogleServicesManager = GoogleServicesManager;
//# sourceMappingURL=googleServicesManager.js.map