export declare class TeamsVoiceCollaboration {
  private teamsClient;
  private cognitiveServices;
  private channelId;
  constructor();
  private initializeServices;
  setupVoiceChannel(): Promise<void>;
  private setupVoiceEndpoint;
  startVoiceSession(): Promise<any>;
}
