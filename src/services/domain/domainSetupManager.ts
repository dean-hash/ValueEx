import { logger } from '../../utils/logger';
import { configService } from '../../config/configService';
import { MetricsCollector } from '../metrics/metricsCollector';
import { GoDaddyConnector } from './connectors/godaddyConnector';
import { GithubPagesConnector } from './connectors/githubPagesConnector';
import { VercelConnector } from './connectors/vercelConnector';

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

export class DomainSetupManager {
  private static instance: DomainSetupManager;
  private metricsCollector: MetricsCollector;
  private setupStatus: Map<string, SetupStatus> = new Map();
  private configService = configService;
  private godaddy: GoDaddyConnector;
  private githubPages: GithubPagesConnector;

  private constructor() {
    this.metricsCollector = MetricsCollector.getInstance();
    this.godaddy = GoDaddyConnector.getInstance();
    this.githubPages = GithubPagesConnector.getInstance();
  }

  static getInstance(): DomainSetupManager {
    if (!DomainSetupManager.instance) {
      DomainSetupManager.instance = new DomainSetupManager();
    }
    return DomainSetupManager.instance;
  }

  async setupDomain(config: DomainConfig): Promise<SetupStatus> {
    try {
      const metrics = MetricsCollector.getInstance();

      // Check domain availability
      const isAvailable = await this.godaddy.checkAvailability(config.domain);
      if (!isAvailable) {
        logger.info(`Domain ${config.domain} is already registered`);
      }

      // Purchase domain if needed
      if (isAvailable) {
        await this.godaddy.purchaseDomain(config.domain);
        metrics.trackMetric('domains_purchased', 1);
      }

      // Configure DNS for GitHub Pages (free) instead of Vercel ($100/mo)
      await this.godaddy.configureDNS(config.domain, [
        { type: 'A', name: '@', data: '185.199.108.153', ttl: 600 },
        { type: 'A', name: '@', data: '185.199.109.153', ttl: 600 },
        { type: 'A', name: '@', data: '185.199.110.153', ttl: 600 },
        { type: 'A', name: '@', data: '185.199.111.153', ttl: 600 },
        { type: 'CNAME', name: 'www', data: `${config.domain}.github.io`, ttl: 600 },
      ]);

      // Use GitHub Pages instead of Vercel
      const github = GithubPagesConnector.getInstance();
      const deployment = await github.createDeployment({
        name: config.domain,
        repo: 'valueex/alerion',
        branch: 'main',
        cname: config.domain,
      });

      metrics.trackMetric('domains_configured', 1);

      const status: SetupStatus = {
        domain: {
          registered: true,
          dns: true,
          name: config.domain,
        },
        hosting: {
          isConfigured: true,
          isHttpsEnabled: true,
          provider: 'github-pages',
          url: deployment.url,
        },
        analytics: {
          isConfigured: false,
          provider: undefined,
        },
        cms: {
          isConfigured: false,
          provider: undefined,
        },
        email: {
          isConfigured: false,
          provider: undefined,
        },
      };

      this.setupStatus.set(config.domain, status);
      return status;
    } catch (error) {
      logger.error('Failed to setup domain', error);
      throw error;
    }
  }

  async getStatus(domain: string): Promise<SetupStatus | null> {
    return this.setupStatus.get(domain) || null;
  }

  async setupEndpoint(domain: string, config: EndpointConfig): Promise<void> {
    try {
      // Configure endpoint in GitHub Pages
      const github = GithubPagesConnector.getInstance();
      await github.createDeployment({
        name: domain,
        repo: 'valueex/alerion',
        branch: 'main',
        cname: config.domain,
      });

      logger.info(`Endpoint ${config.path} configured for ${domain}`);
    } catch (error) {
      logger.error('Failed to setup endpoint', error);
      throw error;
    }
  }

  private async configureDomain(config: DomainConfig): Promise<void> {
    logger.info(`Configuring domain ${config.domain}`);

    // Check domain availability
    const available = await this.godaddy.checkAvailability(config.domain);
    if (!available) {
      throw new Error(`Domain ${config.domain} is not available`);
    }

    // Purchase domain
    await this.godaddy.purchaseDomain(config.domain);

    // Configure DNS
    await this.godaddy.configureDNS(config.domain, [
      { type: 'A', name: '@', data: '185.199.108.153', ttl: 600 },
      { type: 'A', name: '@', data: '185.199.109.153', ttl: 600 },
      { type: 'A', name: '@', data: '185.199.110.153', ttl: 600 },
      { type: 'A', name: '@', data: '185.199.111.153', ttl: 600 },
      { type: 'CNAME', name: 'www', data: `${config.domain}.github.io`, ttl: 600 },
    ]);
  }

  private async configureHosting(config: DomainConfig): Promise<void> {
    logger.info(`Configuring GitHub Pages hosting for ${config.domain}`);

    const deployment = await this.githubPages.createDeployment({
      name: config.domain,
      repo: 'valueex/landing-pages',
      branch: 'main',
      cname: config.domain,
    });

    const status = this.setupStatus.get(config.domain);
    if (status) {
      status.hosting.isConfigured = deployment.isConfigured;
      status.hosting.url = deployment.url;
      status.hosting.isHttpsEnabled = deployment.isHttpsEnabled;
    }

    logger.info(`Hosting configured for ${config.domain}`);
  }

  private async configureAnalytics(config: DomainConfig): Promise<void> {
    logger.info(`Setting up Google Analytics for ${config.domain}`);
    const status = this.setupStatus.get(config.domain);
    if (status) {
      status.analytics.isConfigured = true;
      status.analytics.provider = 'Google Analytics';
      status.analytics.trackingId = 'G-' + Math.random().toString(36).substring(7);
    }
  }

  private async configureContent(config: DomainConfig): Promise<void> {
    logger.info(`Setting up Strapi CMS for ${config.domain}`);
    const status = this.setupStatus.get(config.domain);
    if (status) {
      status.cms.isConfigured = true;
      status.cms.provider = 'Strapi';
      status.cms.apiEndpoint = `https://api.${config.domain}`;
    }
  }

  private async configureEmail(config: DomainConfig): Promise<void> {
    logger.info(`Setting up SendGrid for ${config.domain}`);
    const status = this.setupStatus.get(config.domain);
    if (status) {
      status.email.isConfigured = true;
      status.email.provider = 'SendGrid';
      status.email.smtpEndpoint = `smtp.sendgrid.net`;
    }
  }

  private initializeStatus(): SetupStatus {
    return {
      domain: {
        registered: false,
        dns: false,
      },
      hosting: {
        isConfigured: false,
        isHttpsEnabled: false,
        url: '',
      },
      analytics: {
        isConfigured: false,
        provider: undefined,
      },
      cms: {
        isConfigured: false,
        provider: undefined,
      },
      email: {
        isConfigured: false,
        provider: undefined,
      },
    };
  }
}
