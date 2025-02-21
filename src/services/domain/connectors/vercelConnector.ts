import axios, { AxiosInstance } from 'axios';
import { logger } from '../../../utils/logger';

interface DeploymentConfig {
  name: string;
  gitSource?: {
    repo: string;
    branch?: string;
  };
  buildCommand?: string;
  outputDirectory?: string;
}

interface DeploymentResult {
  isConfigured: boolean;
  isHttpsEnabled: boolean;
  url: string;
}

export class VercelConnector {
  private static instance: VercelConnector;
  private client: AxiosInstance;
  private teamId?: string;

  private constructor() {
    const token = process.env.VERCEL_TOKEN;
    if (!token) {
      throw new Error('VERCEL_TOKEN environment variable is required');
    }

    this.client = axios.create({
      baseURL: 'https://api.vercel.com',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    this.teamId = process.env.VERCEL_TEAM_ID;
  }

  static getInstance(): VercelConnector {
    if (!VercelConnector.instance) {
      VercelConnector.instance = new VercelConnector();
    }
    return VercelConnector.instance;
  }

  async createDeployment(config: DeploymentConfig): Promise<DeploymentResult> {
    try {
      logger.info(`Creating Vercel deployment for ${config.name}`);

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
      logger.info(`Deployment created: ${deployment.url}`);

      return {
        isConfigured: true,
        isHttpsEnabled: true,
        url: `https://${deployment.url}`,
      };
    } catch (error) {
      logger.error('Error creating Vercel deployment', error);
      throw error;
    }
  }
}
