import { UnifiedWorkspace } from './unifiedWorkspace';
import { BusinessCentralService } from './businessCentral';
import { DynamicsService } from './dynamics365';

interface CompanySetup {
  name: string;
  taxId: string;
  bankingInfo: {
    accountNumber: string;
    routingNumber: string;
    bankName: string;
  };
  addresses: {
    business: string;
    mailing?: string;
  };
}

class WorkspaceManager {
  private workspace: UnifiedWorkspace;
  private bc: BusinessCentralService;
  private dynamics: DynamicsService;

  constructor() {
    this.workspace = new UnifiedWorkspace({
      plannerEnabled: true,
      teamsEnabled: true,
      aiEnabled: true,
      domainManagementEnabled: true,
    });
    this.bc = new BusinessCentralService();
    this.dynamics = new DynamicsService();
  }

  async setupCompanyProfile(setup: CompanySetup) {
    // Set up company in Business Central
    await this.bc.createCompanyProfile({
      ...setup,
      type: 'Technology',
      industry: 'AI and Software',
      fiscalYear: {
        start: new Date(new Date().getFullYear(), 0, 1),
        end: new Date(new Date().getFullYear(), 11, 31),
      },
    });

    // Create corresponding customer in Dynamics
    await this.dynamics.createAccount({
      name: setup.name,
      type: 'Internal',
      relationship: 'Parent Company',
    });

    // Set up automated tax tracking
    await this.setupTaxTracking(setup.taxId);
  }

  private async setupTaxTracking(taxId: string) {
    await this.bc.configureTaxTracking({
      taxId,
      trackingCategories: ['Software Development', 'Cloud Services', 'Professional Services'],
      automatedFiling: true,
    });
  }

  async createWorkspaceChannels() {
    const channels = [
      {
        name: 'strategy-planning',
        description: 'High-level strategy and planning discussions',
      },
      {
        name: 'development',
        description: 'Technical development and implementation',
      },
      {
        name: 'business-ops',
        description: 'Business operations and administration',
      },
      {
        name: 'revenue-tracking',
        description: 'Revenue streams and financial monitoring',
      },
    ];

    for (const channel of channels) {
      await this.workspace.createWorkspace(channel.name);
    }
  }

  async setupAutomatedReporting() {
    // Configure automated reports in Business Central
    await this.bc.setupReporting({
      frequency: 'daily',
      reports: ['CashFlow', 'ProfitLoss', 'TaxLiability', 'ExpenseTracking'],
      automation: {
        emailRecipients: ['dean@valueex.ai'],
        teamsChannel: 'business-ops',
      },
    });
  }
}

// Initialize and run setup
const manager = new WorkspaceManager();
manager
  .createWorkspaceChannels()
  .then(() => console.log('Workspace channels created'))
  .catch(console.error);
