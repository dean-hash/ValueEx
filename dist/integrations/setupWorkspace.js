"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const unifiedWorkspace_1 = require("./unifiedWorkspace");
const businessCentral_1 = require("./businessCentral");
const dynamics365_1 = require("./dynamics365");
class WorkspaceManager {
    constructor() {
        this.workspace = new unifiedWorkspace_1.UnifiedWorkspace({
            plannerEnabled: true,
            teamsEnabled: true,
            aiEnabled: true,
            domainManagementEnabled: true
        });
        this.bc = new businessCentral_1.BusinessCentralService();
        this.dynamics = new dynamics365_1.DynamicsService();
    }
    async setupCompanyProfile(setup) {
        // Set up company in Business Central
        await this.bc.createCompanyProfile({
            ...setup,
            type: 'Technology',
            industry: 'AI and Software',
            fiscalYear: {
                start: new Date(new Date().getFullYear(), 0, 1),
                end: new Date(new Date().getFullYear(), 11, 31)
            }
        });
        // Create corresponding customer in Dynamics
        await this.dynamics.createAccount({
            name: setup.name,
            type: 'Internal',
            relationship: 'Parent Company'
        });
        // Set up automated tax tracking
        await this.setupTaxTracking(setup.taxId);
    }
    async setupTaxTracking(taxId) {
        await this.bc.configureTaxTracking({
            taxId,
            trackingCategories: [
                'Software Development',
                'Cloud Services',
                'Professional Services'
            ],
            automatedFiling: true
        });
    }
    async createWorkspaceChannels() {
        const channels = [
            {
                name: 'strategy-planning',
                description: 'High-level strategy and planning discussions'
            },
            {
                name: 'development',
                description: 'Technical development and implementation'
            },
            {
                name: 'business-ops',
                description: 'Business operations and administration'
            },
            {
                name: 'revenue-tracking',
                description: 'Revenue streams and financial monitoring'
            }
        ];
        for (const channel of channels) {
            await this.workspace.createWorkspace(channel.name);
        }
    }
    async setupAutomatedReporting() {
        // Configure automated reports in Business Central
        await this.bc.setupReporting({
            frequency: 'daily',
            reports: [
                'CashFlow',
                'ProfitLoss',
                'TaxLiability',
                'ExpenseTracking'
            ],
            automation: {
                emailRecipients: ['dean@valueex.ai'],
                teamsChannel: 'business-ops'
            }
        });
    }
}
// Initialize and run setup
const manager = new WorkspaceManager();
manager.createWorkspaceChannels()
    .then(() => console.log('Workspace channels created'))
    .catch(console.error);
//# sourceMappingURL=setupWorkspace.js.map