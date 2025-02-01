export declare class GraphService {
  private static instance;
  private client;
  private secureStore;
  private constructor();
  static getInstance(): GraphService;
  forwardEmail(message: any, toAddress: string, analysis: string): Promise<void>;
  createSharedMailbox(name: string, email: string): Promise<void>;
  grantMailboxAccess(mailboxEmail: string, userEmail: string): Promise<void>;
}
