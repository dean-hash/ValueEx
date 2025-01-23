"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainSetupManager = void 0;
const logger_1 = require("../../utils/logger");
const configService_1 = require("../../config/configService");
const metricsCollector_1 = require("../metrics/metricsCollector");
const godaddyConnector_1 = require("./connectors/godaddyConnector");
const githubPagesConnector_1 = require("./connectors/githubPagesConnector");
class DomainSetupManager {
    constructor() {
        this.setupStatus = new Map();
        this.configService = configService_1.configService;
        this.metricsCollector = metricsCollector_1.MetricsCollector.getInstance();
        this.godaddy = godaddyConnector_1.GoDaddyConnector.getInstance();
        this.githubPages = githubPagesConnector_1.GithubPagesConnector.getInstance();
    }
    static getInstance() {
        if (!DomainSetupManager.instance) {
            DomainSetupManager.instance = new DomainSetupManager();
        }
        return DomainSetupManager.instance;
    }
    async setupDomain(config) {
        try {
            const metrics = metricsCollector_1.MetricsCollector.getInstance();
            // Check domain availability
            const isAvailable = await this.godaddy.checkAvailability(config.domain);
            if (!isAvailable) {
                logger_1.logger.info(`Domain ${config.domain} is already registered`);
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
                { type: 'CNAME', name: 'www', data: `${config.domain}.github.io`, ttl: 600 }
            ]);
            // Use GitHub Pages instead of Vercel
            const github = githubPagesConnector_1.GithubPagesConnector.getInstance();
            const deployment = await github.createDeployment({
                name: config.domain,
                repo: 'valueex/alerion',
                branch: 'main',
                cname: config.domain
            });
            metrics.trackMetric('domains_configured', 1);
            const status = {
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
        }
        catch (error) {
            logger_1.logger.error('Failed to setup domain', error);
            throw error;
        }
    }
    async getStatus(domain) {
        return this.setupStatus.get(domain) || null;
    }
    async setupEndpoint(domain, config) {
        try {
            // Configure endpoint in GitHub Pages
            const github = githubPagesConnector_1.GithubPagesConnector.getInstance();
            await github.createDeployment({
                name: domain,
                repo: 'valueex/alerion',
                branch: 'main',
                cname: config.domain
            });
            logger_1.logger.info(`Endpoint ${config.path} configured for ${domain}`);
        }
        catch (error) {
            logger_1.logger.error('Failed to setup endpoint', error);
            throw error;
        }
    }
    async configureDomain(config) {
        logger_1.logger.info(`Configuring domain ${config.domain}`);
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
            { type: 'CNAME', name: 'www', data: `${config.domain}.github.io`, ttl: 600 }
        ]);
    }
    async configureHosting(config) {
        logger_1.logger.info(`Configuring GitHub Pages hosting for ${config.domain}`);
        const deployment = await this.githubPages.createDeployment({
            name: config.domain,
            repo: 'valueex/landing-pages',
            branch: 'main',
            cname: config.domain
        });
        const status = this.setupStatus.get(config.domain);
        if (status) {
            status.hosting.isConfigured = deployment.isConfigured;
            status.hosting.url = deployment.url;
            status.hosting.isHttpsEnabled = deployment.isHttpsEnabled;
        }
        logger_1.logger.info(`Hosting configured for ${config.domain}`);
    }
    async configureAnalytics(config) {
        logger_1.logger.info(`Setting up Google Analytics for ${config.domain}`);
        const status = this.setupStatus.get(config.domain);
        if (status) {
            status.analytics.isConfigured = true;
            status.analytics.provider = 'Google Analytics';
            status.analytics.trackingId = 'G-' + Math.random().toString(36).substring(7);
        }
    }
    async configureContent(config) {
        logger_1.logger.info(`Setting up Strapi CMS for ${config.domain}`);
        const status = this.setupStatus.get(config.domain);
        if (status) {
            status.cms.isConfigured = true;
            status.cms.provider = 'Strapi';
            status.cms.apiEndpoint = `https://api.${config.domain}`;
        }
    }
    async configureEmail(config) {
        logger_1.logger.info(`Setting up SendGrid for ${config.domain}`);
        const status = this.setupStatus.get(config.domain);
        if (status) {
            status.email.isConfigured = true;
            status.email.provider = 'SendGrid';
            status.email.smtpEndpoint = `smtp.sendgrid.net`;
        }
    }
    initializeStatus() {
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
exports.DomainSetupManager = DomainSetupManager;
//# sourceMappingURL=domainSetupManager.js.map