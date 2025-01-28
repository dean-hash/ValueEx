import { logger } from '../../utils/logger';
import * as k8s from '@kubernetes/client-node';

interface ScalingConfig {
  metric: string;
  minInstances: number;
  maxInstances: number;
  targetCPUUtilization: number;
}

export class AutoScaler {
  private kc: k8s.KubeConfig;
  private k8sApi: k8s.AppsV1Api;
  private metricsApi: k8s.CustomObjectsApi;
  private config?: ScalingConfig;
  private namespace = 'valueex';
  private deploymentName = 'valueex-revenue-tracker';

  constructor() {
    this.kc = new k8s.KubeConfig();
    this.kc.loadFromDefault();
    
    this.k8sApi = this.kc.makeApiClient(k8s.AppsV1Api);
    this.metricsApi = this.kc.makeApiClient(k8s.CustomObjectsApi);
  }

  configure(config: ScalingConfig): void {
    this.config = config;
    
    // Create HPA
    this.createHPA().catch(error => {
      logger.error('Error creating HPA:', error);
    });
  }

  private async createHPA(): Promise<void> {
    if (!this.config) return;

    const hpa = {
      apiVersion: 'autoscaling/v2',
      kind: 'HorizontalPodAutoscaler',
      metadata: {
        name: `${this.deploymentName}-hpa`,
        namespace: this.namespace
      },
      spec: {
        scaleTargetRef: {
          apiVersion: 'apps/v1',
          kind: 'Deployment',
          name: this.deploymentName
        },
        minReplicas: this.config.minInstances,
        maxReplicas: this.config.maxInstances,
        metrics: [
          {
            type: 'Resource',
            resource: {
              name: 'cpu',
              target: {
                type: 'Utilization',
                averageUtilization: this.config.targetCPUUtilization
              }
            }
          }
        ]
      }
    };

    try {
      await this.k8sApi.createNamespacedHorizontalPodAutoscaler(
        this.namespace,
        hpa
      );
      
      logger.info('HPA created successfully');
    } catch (error) {
      logger.error('Error creating HPA:', error);
      throw error;
    }
  }

  start(): void {
    // Start monitoring metrics
    this.monitorMetrics();
  }

  private async monitorMetrics(): Promise<void> {
    setInterval(async () => {
      try {
        const metrics = await this.getMetrics();
        logger.info('Current metrics:', metrics);

        // Check if we need to scale
        if (metrics.cpuUtilization > this.config?.targetCPUUtilization) {
          await this.scaleOut();
        } else if (metrics.cpuUtilization < this.config?.targetCPUUtilization / 2) {
          await this.scaleIn();
        }
      } catch (error) {
        logger.error('Error monitoring metrics:', error);
      }
    }, 30000); // Check every 30 seconds
  }

  async scaleOut(): Promise<void> {
    try {
      const deployment = await this.k8sApi.readNamespacedDeployment(
        this.deploymentName,
        this.namespace
      );

      const currentReplicas = deployment.body.spec?.replicas || 0;
      const newReplicas = Math.min(
        currentReplicas + 1,
        this.config?.maxInstances || currentReplicas
      );

      if (newReplicas > currentReplicas) {
        await this.k8sApi.patchNamespacedDeployment(
          this.deploymentName,
          this.namespace,
          {
            spec: {
              replicas: newReplicas
            }
          },
          undefined,
          undefined,
          undefined,
          undefined,
          {
            headers: { 'Content-Type': 'application/strategic-merge-patch+json' }
          }
        );

        logger.info(`Scaled out to ${newReplicas} replicas`);
      }
    } catch (error) {
      logger.error('Error scaling out:', error);
      throw error;
    }
  }

  async scaleIn(): Promise<void> {
    try {
      const deployment = await this.k8sApi.readNamespacedDeployment(
        this.deploymentName,
        this.namespace
      );

      const currentReplicas = deployment.body.spec?.replicas || 0;
      const newReplicas = Math.max(
        currentReplicas - 1,
        this.config?.minInstances || 1
      );

      if (newReplicas < currentReplicas) {
        await this.k8sApi.patchNamespacedDeployment(
          this.deploymentName,
          this.namespace,
          {
            spec: {
              replicas: newReplicas
            }
          },
          undefined,
          undefined,
          undefined,
          undefined,
          {
            headers: { 'Content-Type': 'application/strategic-merge-patch+json' }
          }
        );

        logger.info(`Scaled in to ${newReplicas} replicas`);
      }
    } catch (error) {
      logger.error('Error scaling in:', error);
      throw error;
    }
  }

  async getMetrics(): Promise<any> {
    try {
      const metrics = await this.metricsApi.getNamespacedCustomObject(
        'metrics.k8s.io',
        'v1beta1',
        this.namespace,
        'pods',
        `${this.deploymentName}-metrics`
      );

      return {
        cpuUtilization: this.calculateCPUUtilization(metrics),
        memoryUtilization: this.calculateMemoryUtilization(metrics),
        replicas: await this.getCurrentReplicas()
      };
    } catch (error) {
      logger.error('Error getting metrics:', error);
      throw error;
    }
  }

  private async getCurrentReplicas(): Promise<number> {
    const deployment = await this.k8sApi.readNamespacedDeployment(
      this.deploymentName,
      this.namespace
    );
    return deployment.body.spec?.replicas || 0;
  }

  private calculateCPUUtilization(metrics: any): number {
    // Implementation depends on metrics format
    return 0;
  }

  private calculateMemoryUtilization(metrics: any): number {
    // Implementation depends on metrics format
    return 0;
  }
}
