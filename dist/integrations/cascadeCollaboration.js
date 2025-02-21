"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CascadeCollaboration = void 0;
const teams_client_1 = require("@microsoft/teams-client");
const dynamics365_1 = require("./dynamics365");
const businessCentral_1 = require("./businessCentral");
const planner_1 = require("./planner");
const openai_1 = require("@azure/openai");
class CascadeCollaboration {
    constructor() {
        this.initializeServices();
    }
    async initializeServices() {
        // Initialize all services with proper credentials
        this.teamsClient = await teams_client_1.TeamsClient.initialize();
        this.dynamicsService = new dynamics365_1.DynamicsService();
        this.bcService = new businessCentral_1.BusinessCentralService();
        this.plannerService = new planner_1.PlannerService();
        this.aiService = new openai_1.AzureOpenAI();
    }
    async startCollaboration() {
        // Set up real-time communication channels
        await this.setupChannels();
        // Initialize business intelligence monitoring
        await this.initializeBusinessIntelligence();
        // Start proactive opportunity identification
        this.startOpportunityMonitoring();
    }
    async setupChannels() {
        // Configure Teams channels for different aspects of collaboration
        await this.teamsClient.createChannel('ValueEx-Strategy');
        await this.teamsClient.createChannel('Development');
        await this.teamsClient.createChannel('Business-Intelligence');
    }
    async initializeBusinessIntelligence() {
        // Connect to Dynamics 365 and Business Central
        await this.dynamicsService.connect();
        await this.bcService.connect();
        // Set up real-time monitoring
        this.startMetricsMonitoring();
    }
    startOpportunityMonitoring() {
        // Continuously analyze business data for opportunities
        setInterval(async () => {
            const opportunities = await this.analyzeOpportunities();
            if (opportunities.length > 0) {
                await this.notifyTeam(opportunities);
            }
        }, 300000); // Every 5 minutes
    }
    async analyzeOpportunities() {
        // Analyze various data sources for business opportunities
        const dynamicsData = await this.dynamicsService.getLatestMetrics();
        const bcData = await this.bcService.getFinancialMetrics();
        return this.aiService.analyzeBusinessOpportunities(dynamicsData, bcData);
    }
    async notifyTeam(opportunities) {
        // Create tasks in Planner and notify team in Teams
        await this.plannerService.createTasks(opportunities);
        await this.teamsClient.sendMessage('Business-Intelligence', {
            content: 'New business opportunities identified',
            data: opportunities
        });
    }
}
exports.CascadeCollaboration = CascadeCollaboration;
//# sourceMappingURL=cascadeCollaboration.js.map