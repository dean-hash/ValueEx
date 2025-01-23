"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.APIMonitor = void 0;
const logger_1 = require("../logger/logger");
const alertManager_1 = require("../services/alertManager");
const configService_1 = require("../config/configService");
const axios_1 = __importDefault(require("axios"));
class APIMonitor {
    constructor() {
        this.checkInterval = null;
        this.logger = new logger_1.Logger();
        this.alertManager = alertManager_1.AlertManager.getInstance();
        this.configService = configService_1.ConfigService.getInstance();
    }
    static getInstance() {
        if (!APIMonitor.instance) {
            APIMonitor.instance = new APIMonitor();
        }
        return APIMonitor.instance;
    }
    startMonitoring(intervalMs = 300000) {
        // Default: 5 minutes
        if (this.checkInterval) {
            this.stopMonitoring();
        }
        this.checkInterval = setInterval(() => {
            this.checkAwinAPI();
        }, intervalMs);
        this.logger.info('API monitoring started');
    }
    stopMonitoring() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }
    async checkAwinAPI() {
        const apiKey = this.configService.getAwinApiKey();
        const publisherId = this.configService.get('AWIN_PUBLISHER_ID');
        const baseUrl = 'https://api.awin.com';
        try {
            // First, check the known working endpoint
            const startTime = Date.now();
            await axios_1.default.get(`${baseUrl}/publishers/${publisherId}/programmes`, {
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
                await axios_1.default.get(`${baseUrl}/publishers/${publisherId}/product-search`, {
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
            }
            catch (error) {
                if (error.response?.status === 404) {
                    this.logger.warn('Product Search endpoint still unavailable');
                }
                else {
                    throw error; // Re-throw unexpected errors
                }
            }
        }
        catch (error) {
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
    async runManualCheck() {
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
        }
        catch (error) {
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
exports.APIMonitor = APIMonitor;
//# sourceMappingURL=apiMonitor.js.map