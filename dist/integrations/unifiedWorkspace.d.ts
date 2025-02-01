interface WorkspaceConfig {
  plannerEnabled: boolean;
  teamsEnabled: boolean;
  aiEnabled: boolean;
  domainManagementEnabled: boolean;
}
export declare class UnifiedWorkspace {
  private planner;
  private teams;
  private ai;
  private domainManager;
  private dynamicsService;
  private bcService;
  constructor(config: WorkspaceConfig);
  private initializeServices;
  createWorkspace(name: string): Promise<{
    channelId: any;
    planId: any;
  }>;
  initializeBusinessTracking(workspaceName: string): Promise<void>;
  analyzeDomainPortfolio(): Promise<any[]>;
  trackProgress(): Promise<{
    progress: any;
    revenue: any;
    costs: any;
    opportunities: any;
  }>;
}
export {};
