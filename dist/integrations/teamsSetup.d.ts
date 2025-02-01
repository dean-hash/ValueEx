export declare class TeamsSetup {
  private teamsClient;
  private graphClient;
  private voiceCollab;
  constructor();
  private initializeClients;
  cleanupEnvironment(): Promise<void>;
  private isEssentialTeam;
  private archiveTeam;
  private cleanupLicenses;
  private removeLicenses;
  setupNewEnvironment(): Promise<void>;
}
