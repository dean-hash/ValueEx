"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnifiedWorkspace = void 0;
const planner_client_1 = require("@microsoft/planner-client");
const teams_client_1 = require("@microsoft/teams-client");
const openai_1 = require("@azure/openai");
const portfolioAnalyzer_1 = require("../services/domain/portfolioAnalyzer");
const dynamics365_1 = require("./dynamics365");
const businessCentral_1 = require("./businessCentral");
class UnifiedWorkspace {
    constructor(config) {
        this.initializeServices(config);
    }
    async initializeServices(config) {
        if (config.plannerEnabled) {
            this.planner = await planner_client_1.PlannerService.initialize();
        }
        if (config.teamsEnabled) {
            this.teams = await teams_client_1.TeamsClient.initialize();
        }
        if (config.aiEnabled) {
            this.ai = new openai_1.AzureOpenAI();
        }
        if (config.domainManagementEnabled) {
            this.domainManager = new portfolioAnalyzer_1.DomainPortfolioManager();
        }
        // Always initialize business services
        this.dynamicsService = new dynamics365_1.DynamicsService();
        this.bcService = new businessCentral_1.BusinessCentralService();
    }
    async createWorkspace(name) {
        // Create Teams channel
        const channel = await this.teams.createChannel(name);
        // Create Planner plan
        const plan = await this.planner.createPlan({
            name,
            channelId: channel.id
        });
        // Initialize business tracking
        await this.initializeBusinessTracking(name);
        return {
            channelId: channel.id,
            planId: plan.id
        };
    }
    async initializeBusinessTracking(workspaceName) {
        // Set up Dynamics 365 tracking
        await this.dynamicsService.createProject({
            name: workspaceName,
            type: 'ValueEx Workspace',
            status: 'Active'
        });
        // Set up Business Central tracking
        await this.bcService.createProjectAccount({
            name: workspaceName,
            type: 'Workspace',
            category: 'Development'
        });
    }
    async analyzeDomainPortfolio() {
        const domains = await this.domainManager.listDomains();
        const opportunities = [];
        for (const domain of domains) {
            const analysis = await this.domainManager.analyzeDomain(domain);
            if (analysis.potentialValue > analysis.currentValue) {
                opportunities.push({
                    domain,
                    potentialValue: analysis.potentialValue,
                    strategy: analysis.recommendedStrategy
                });
            }
        }
        // Create tasks for each opportunity
        for (const opportunity of opportunities) {
            await this.planner.createTask({
                title: `Domain Opportunity: ${opportunity.domain}`,
                description: `Potential value: ${opportunity.potentialValue}\nStrategy: ${opportunity.strategy}`,
                priority: 'High'
            });
        }
        return opportunities;
    }
    async trackProgress() {
        const metrics = await this.dynamicsService.getProjectMetrics();
        const financials = await this.bcService.getProjectFinancials();
        return {
            progress: metrics.progress,
            revenue: financials.revenue,
            costs: financials.costs,
            opportunities: metrics.opportunities
        };
    }
}
exports.UnifiedWorkspace = UnifiedWorkspace;
//# sourceMappingURL=unifiedWorkspace.js.map