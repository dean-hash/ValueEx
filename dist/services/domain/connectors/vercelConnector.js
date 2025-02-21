"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VercelConnector = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../../../utils/logger");
class VercelConnector {
    constructor() {
        const token = process.env.VERCEL_TOKEN;
        if (!token) {
            throw new Error('VERCEL_TOKEN environment variable is required');
        }
        this.client = axios_1.default.create({
            baseURL: 'https://api.vercel.com',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        this.teamId = process.env.VERCEL_TEAM_ID;
    }
    static getInstance() {
        if (!VercelConnector.instance) {
            VercelConnector.instance = new VercelConnector();
        }
        return VercelConnector.instance;
    }
    async createDeployment(config) {
        try {
            logger_1.logger.info(`Creating Vercel deployment for ${config.name}`);
            // Create project if it doesn't exist
            const projectResponse = await this.client.post('/v9/projects', {
                name: config.name,
                framework: 'nextjs',
                gitRepository: config.gitSource
                    ? {
                        repo: config.gitSource.repo,
                        type: 'github',
                    }
                    : undefined,
                ...(this.teamId ? { teamId: this.teamId } : {}),
            });
            const projectId = projectResponse.data.id;
            // Create deployment
            const deploymentResponse = await this.client.post('/v13/deployments', {
                name: config.name,
                target: 'production',
                projectId,
                ...(this.teamId ? { teamId: this.teamId } : {}),
                source: 'api',
                build: {
                    command: config.buildCommand,
                    output: config.outputDirectory,
                },
            });
            const deployment = deploymentResponse.data;
            logger_1.logger.info(`Deployment created: ${deployment.url}`);
            return {
                isConfigured: true,
                isHttpsEnabled: true,
                url: `https://${deployment.url}`,
            };
        }
        catch (error) {
            logger_1.logger.error('Error creating Vercel deployment', error);
            throw error;
        }
    }
}
exports.VercelConnector = VercelConnector;
//# sourceMappingURL=vercelConnector.js.map