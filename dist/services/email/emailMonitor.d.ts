export declare class EmailMonitor {
  private static instance;
  private clients;
  private gemini;
  private graph;
  private isMonitoring;
  private constructor();
  static getInstance(): EmailMonitor;
  startMonitoring(): Promise<void>;
  stopMonitoring(): Promise<void>;
  private getLatestEmails;
  processEmail(email: any, account: string): Promise<void>;
  private forwardEmail;
  private storeFailedForward;
  private storeBusinessIntelligence;
  private extractPriority;
  private getAccountForwardTo;
  searchEmails(account: string, query: string, days?: number): Promise<any[]>;
}
