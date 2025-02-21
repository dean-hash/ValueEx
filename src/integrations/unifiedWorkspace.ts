import { PlannerService } from '@microsoft/planner-client';
import { TeamsClient } from '@microsoft/teams-client';
import { AzureOpenAI } from '@azure/openai';
import { DomainPortfolioManager } from '../services/domain/portfolioAnalyzer';
import { DynamicsService } from './dynamics365';
import { BusinessCentralService } from './businessCentral';

interface WorkspaceConfig {
  plannerEnabled: boolean;
  teamsEnabled: boolean;
  aiEnabled: boolean;
  domainManagementEnabled: boolean;
}

export class UnifiedWorkspace {
  private planner: PlannerService;
  private teams: TeamsClient;
  private ai: AzureOpenAI;
  private domainManager: DomainPortfolioManager;
  private dynamicsService: DynamicsService;
  private bcService: BusinessCentralService;

  constructor(config: WorkspaceConfig) {
    this.initializeServices(config);
  }

  private async initializeServices(config: WorkspaceConfig) {
    if (config.plannerEnabled) {
      this.planner = await PlannerService.initialize();
    }
    if (config.teamsEnabled) {
      this.teams = await TeamsClient.initialize();
    }
    if (config.aiEnabled) {
      this.ai = new AzureOpenAI();
    }
    if (config.domainManagementEnabled) {
      this.domainManager = new DomainPortfolioManager();
    }

    // Always initialize business services
    this.dynamicsService = new DynamicsService();
    this.bcService = new BusinessCentralService();
  }

  async createWorkspace(name: string) {
    // Create Teams channel
    const channel = await this.teams.createChannel(name);

    // Create Planner plan
    const plan = await this.planner.createPlan({
      name,
      channelId: channel.id,
    });

    // Initialize business tracking
    await this.initializeBusinessTracking(name);

    return {
      channelId: channel.id,
      planId: plan.id,
    };
  }

  async initializeBusinessTracking(workspaceName: string) {
    // Set up Dynamics 365 tracking
    await this.dynamicsService.createProject({
      name: workspaceName,
      type: 'ValueEx Workspace',
      status: 'Active',
    });

    // Set up Business Central tracking
    await this.bcService.createProjectAccount({
      name: workspaceName,
      type: 'Workspace',
      category: 'Development',
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
          strategy: analysis.recommendedStrategy,
        });
      }
    }

    // Create tasks for each opportunity
    for (const opportunity of opportunities) {
      await this.planner.createTask({
        title: `Domain Opportunity: ${opportunity.domain}`,
        description: `Potential value: ${opportunity.potentialValue}\nStrategy: ${opportunity.strategy}`,
        priority: 'High',
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
      opportunities: metrics.opportunities,
    };
  }
}
