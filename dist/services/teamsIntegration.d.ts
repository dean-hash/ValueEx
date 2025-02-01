export declare class TeamsIntegration {
  private graphClient;
  private communicationService;
  private speechService;
  private metricsService;
  constructor();
  initialize(): Promise<void>;
  startMeeting(subject: string): Promise<{
    joinUrl: string;
    threadId: string;
  }>;
  joinMeeting(meetingUrl: string): Promise<{
    user: CommunicationUserIdentifier;
    recognizer: import('microsoft-cognitiveservices-speech-sdk').SpeechRecognizer;
  }>;
  private generateResponse;
  private sendAudioToMeeting;
  leaveMeeting(user: any, recognizer: any): Promise<void>;
}
