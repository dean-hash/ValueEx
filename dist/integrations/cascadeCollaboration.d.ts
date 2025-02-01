export declare class CascadeCollaboration {
  private teamsClient;
  private dynamicsService;
  private bcService;
  private plannerService;
  private aiService;
  constructor();
  private initializeServices;
  startCollaboration(): Promise<void>;
  private setupChannels;
  private initializeBusinessIntelligence;
  private startOpportunityMonitoring;
  private analyzeOpportunities;
  private notifyTeam;
}
