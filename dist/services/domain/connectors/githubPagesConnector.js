"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GithubPagesConnector = void 0;
const rest_1 = require("@octokit/rest");
const logger_1 = require("../../../utils/logger");
const configService_1 = require("../../../config/configService");
class GithubPagesConnector {
    constructor() {
        this.config = configService_1.ConfigService.getInstance();
        // Using existing GitHub token from our repo
        const token = this.config.get('GITHUB_TOKEN') || process.env.GITHUB_TOKEN;
        if (!token) {
            throw new Error('GitHub token not found in configuration');
        }
        this.octokit = new rest_1.Octokit({ auth: token });
    }
    static getInstance() {
        if (!GithubPagesConnector.instance) {
            GithubPagesConnector.instance = new GithubPagesConnector();
        }
        return GithubPagesConnector.instance;
    }
    async enablePages(config) {
        try {
            // Enable GitHub Pages
            await this.octokit.repos.enablePages({
                owner: config.owner,
                repo: config.repo,
                source: {
                    branch: config.branch,
                    path: '/', // Root directory
                },
            });
            if (config.domain) {
                // Configure custom domain
                await this.octokit.repos.updateInformation({
                    owner: config.owner,
                    repo: config.repo,
                    homepage: `https://${config.domain}`,
                });
                // Set custom domain for Pages
                await this.octokit.repos.updatePages({
                    owner: config.owner,
                    repo: config.repo,
                    cname: config.domain,
                });
            }
            logger_1.Logger.info('GitHub Pages enabled', {
                repo: `${config.owner}/${config.repo}`,
                domain: config.domain,
            });
        }
        catch (error) {
            logger_1.Logger.error('Failed to enable GitHub Pages', { error, config });
            throw error;
        }
    }
    async getPageStatus(owner, repo) {
        try {
            const { data } = await this.octokit.repos.getPages({
                owner,
                repo,
            });
            return {
                url: data.html_url,
                status: data.status,
                enforceHttps: data.https_enforced,
                customDomain: data.custom_domain,
            };
        }
        catch (error) {
            logger_1.Logger.error('Failed to get Pages status', { error, owner, repo });
            throw error;
        }
    }
    async createDeployment(config) {
        try {
            // Create deployment
            const { data: deployment } = await this.octokit.repos.createDeployment({
                owner: config.owner,
                repo: config.repo,
                ref: config.branch,
                environment: 'github-pages',
                auto_merge: false,
            });
            // Set deployment status
            await this.octokit.repos.createDeploymentStatus({
                owner: config.owner,
                repo: config.repo,
                deployment_id: deployment.id,
                state: 'success',
            });
            logger_1.Logger.info('GitHub Pages deployment created', {
                repo: `${config.owner}/${config.repo}`,
                deploymentId: deployment.id,
            });
            return deployment;
        }
        catch (error) {
            logger_1.Logger.error('Failed to create deployment', { error, config });
            throw error;
        }
    }
    async verifyDomainSetup(config) {
        if (!config.domain)
            return true;
        try {
            const status = await this.getPageStatus(config.owner, config.repo);
            return {
                isConfigured: status.customDomain === config.domain,
                isHttpsEnabled: status.enforceHttps,
                url: status.url,
            };
        }
        catch (error) {
            logger_1.Logger.error('Failed to verify domain setup', { error, config });
            throw error;
        }
    }
}
exports.GithubPagesConnector = GithubPagesConnector;
//# sourceMappingURL=githubPagesConnector.js.map