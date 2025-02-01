interface DomainConfig {
  domain: string;
  platform: 'amazon' | 'ebay';
  settings: {
    useVercel?: boolean;
    useGoogleAnalytics?: boolean;
    useStrapi?: boolean;
    useSendGrid?: boolean;
  };
}
interface EndpointConfig {
  path: string;
  cors?: boolean;
  rateLimit?: boolean;
}
interface SetupStatus {
  domain: {
    registered: boolean;
    dns: boolean;
    name?: string;
  };
  hosting: {
    isConfigured: boolean;
    isHttpsEnabled: boolean;
    url: string;
    provider?: string;
  };
  analytics: {
    isConfigured: boolean;
    provider?: string;
    trackingId?: string;
  };
  cms: {
    isConfigured: boolean;
    provider?: string;
    apiEndpoint?: string;
  };
  email: {
    isConfigured: boolean;
    provider?: string;
    smtpEndpoint?: string;
  };
}
export declare class DomainSetupManager {
  private static instance;
  private metricsCollector;
  private setupStatus;
  private configService;
  private godaddy;
  private githubPages;
  private constructor();
  static getInstance(): DomainSetupManager;
  setupDomain(config: DomainConfig): Promise<SetupStatus>;
  getStatus(domain: string): Promise<SetupStatus | null>;
  setupEndpoint(domain: string, config: EndpointConfig): Promise<void>;
  private configureDomain;
  private configureHosting;
  private configureAnalytics;
  private configureContent;
  private configureEmail;
  private initializeStatus;
}
export {};
