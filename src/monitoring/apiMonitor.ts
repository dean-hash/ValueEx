import { Logger } from '../logger/logger';
import { AlertManager } from '../services/alertManager';
import { ConfigService } from '../config/configService';
import axios from 'axios';

export class APIMonitor {
  private static instance: APIMonitor;
  private logger: Logger;
  private alertManager: AlertManager;
  private configService: ConfigService;
  private checkInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.logger = new Logger();
    this.alertManager = AlertManager.getInstance();
    this.configService = ConfigService.getInstance();
  }

  public static getInstance(): APIMonitor {
    if (!APIMonitor.instance) {
      APIMonitor.instance = new APIMonitor();
    }
    return APIMonitor.instance;
  }

  public startMonitoring(intervalMs: number = 300000) {
    // Default: 5 minutes
    if (this.checkInterval) {
      this.stopMonitoring();
    }

    this.checkInterval = setInterval(() => {
      this.checkAwinAPI();
    }, intervalMs);

    this.logger.info('API monitoring started');
  }

  public stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private async checkAwinAPI() {
    const apiKey = this.configService.getAwinApiKey();
    const publisherId = this.configService.get('AWIN_PUBLISHER_ID');
    const baseUrl = 'https://api.awin.com';

    try {
      // First, check the known working endpoint
      const startTime = Date.now();
      await axios.get(`${baseUrl}/publishers/${publisherId}/programmes`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      this.logger.info('Awin API health check passed', {
        endpoint: '/programmes',
        responseTime,
      });

      // Now check the product search endpoint
      try {
        const productSearchStart = Date.now();
        await axios.get(`${baseUrl}/publishers/${publisherId}/product-search`, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          params: {
            searchTerm: 'test',
          },
        });

        // If we get here, the product search endpoint is working!
        const productSearchTime = Date.now() - productSearchStart;

        this.alertManager.sendAlert({
          type: 'API_STATUS',
          severity: 'info',
          message: 'Awin Product Search API is now available!',
          data: {
            endpoint: '/product-search',
            responseTime: productSearchTime,
          },
        });

        this.logger.info('Product Search endpoint is now available!', {
          responseTime: productSearchTime,
        });
      } catch (error: any) {
        if (error.response?.status === 404) {
          this.logger.warn('Product Search endpoint still unavailable');
        } else {
          throw error; // Re-throw unexpected errors
        }
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;

      this.alertManager.sendAlert({
        type: 'API_ERROR',
        severity: 'error',
        message: 'Awin API health check failed',
        data: {
          error: errorMessage,
          status: error.response?.status,
        },
      });

      this.logger.error('Awin API health check failed', {
        error: errorMessage,
        status: error.response?.status,
      });
    }
  }

  public async runManualCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'error';
    details: {
      programmes: boolean;
      productSearch: boolean;
      responseTime?: number;
    };
  }> {
    try {
      const startTime = Date.now();
      await this.checkAwinAPI();
      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        details: {
          programmes: true,
          productSearch: false, // Currently known to be down
          responseTime,
        },
      };
    } catch (error) {
      return {
        status: 'error',
        details: {
          programmes: false,
          productSearch: false,
        },
      };
    }
  }
}
