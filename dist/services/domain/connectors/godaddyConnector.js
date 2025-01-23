"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoDaddyConnector = void 0;
const axios_1 = __importDefault(require("axios"));
const configService_1 = require("../../../config/configService");
const logger_1 = require("../../../utils/logger");
const credentialsManager_1 = require("../../../config/credentialsManager");
const puppeteer_1 = __importDefault(require("puppeteer"));
const errors_1 = require("../../../types/errors");
const async_1 = require("../../../utils/async");
class GoDaddyConnector {
    constructor() {
        this.retryCount = 3;
        this.retryDelay = 1000;
        const config = configService_1.configService.getGodaddyConfig();
        this.config = {
            apiKey: config.apiKey,
            apiSecret: config.apiSecret,
            endpoint: 'https://api.godaddy.com/v1',
        };
        console.log('GoDaddy API Key:', this.config.apiKey ? '***' + this.config.apiKey.slice(-4) : 'not set');
        console.log('GoDaddy API Secret:', this.config.apiSecret ? '***' + this.config.apiSecret.slice(-4) : 'not set');
        this.axiosInstance = axios_1.default.create({
            baseURL: this.config.endpoint,
            headers: {
                Authorization: `sso-key ${this.config.apiKey}:${this.config.apiSecret}`,
                'Content-Type': 'application/json',
            },
        });
        this.credentialsManager = credentialsManager_1.CredentialsManager.getInstance();
    }
    static getInstance() {
        if (!GoDaddyConnector.instance) {
            GoDaddyConnector.instance = new GoDaddyConnector();
        }
        return GoDaddyConnector.instance;
    }
    async withRetry(operation) {
        let lastError;
        for (let i = 0; i < this.retryCount; i++) {
            try {
                return await operation();
            }
            catch (error) {
                lastError = error;
                if (!(error instanceof errors_1.RetryableError)) {
                    throw error;
                }
                if (i < this.retryCount - 1) {
                    await (0, async_1.sleep)(this.retryDelay * Math.pow(2, i));
                }
            }
        }
        throw lastError;
    }
    async checkAvailability(domain) {
        return this.withRetry(async () => {
            try {
                const response = await this.axiosInstance.get(`/domains/available?domain=${domain}`);
                return response.data.available;
            }
            catch (error) {
                if (error.response?.status === 429) {
                    throw new errors_1.RetryableError('Rate limit exceeded', error);
                }
                throw error;
            }
        });
    }
    async purchaseDomain(domain) {
        return this.withRetry(async () => {
            try {
                await this.axiosInstance.post('/domains/purchase', {
                    domain,
                    consent: {
                        agreementKeys: ['DNRA'],
                        agreedBy: 'ValueEx System',
                        agreedAt: new Date().toISOString(),
                    },
                });
                logger_1.logger.info(`Domain ${domain} purchased successfully`);
            }
            catch (error) {
                if (error.response?.status === 429) {
                    throw new errors_1.RetryableError('Rate limit exceeded', error);
                }
                throw error;
            }
        });
    }
    async configureDNS(domain, records) {
        return this.withRetry(async () => {
            try {
                await this.axiosInstance.put(`/domains/${domain}/records`, records);
                logger_1.logger.info('DNS records updated successfully');
            }
            catch (error) {
                if (error.response?.status === 429) {
                    throw new errors_1.RetryableError('Rate limit exceeded', error);
                }
                throw error;
            }
        });
    }
    async getDomainStatus(domain) {
        return this.withRetry(async () => {
            try {
                const response = await this.axiosInstance.get(`/domains/${domain}`);
                return response.data;
            }
            catch (error) {
                if (error.response?.status === 429) {
                    throw new errors_1.RetryableError('Rate limit exceeded', error);
                }
                throw error;
            }
        });
    }
    async setupVercelDNS(domain) {
        const records = [
            {
                type: 'A',
                name: '@',
                data: '76.76.21.21',
                ttl: 600,
            },
            {
                type: 'CNAME',
                name: 'www',
                data: 'cname.vercel-dns.com',
                ttl: 600,
            },
        ];
        await this.configureDNS(domain, records);
    }
    async listDomains() {
        return this.withRetry(async () => {
            try {
                const response = await this.axiosInstance.get('/domains');
                return response.data.map((domain) => ({
                    domain: domain.domain,
                    status: domain.status,
                    expires: domain.expires,
                }));
            }
            catch (error) {
                if (error.response?.status === 429) {
                    throw new errors_1.RetryableError('Rate limit exceeded', error);
                }
                throw error;
            }
        });
    }
    async getDomains() {
        return this.withRetry(async () => {
            try {
                const response = await this.axiosInstance.get('/domains');
                return response.data.map((domain) => domain.domain);
            }
            catch (error) {
                if (error.response?.status === 429) {
                    throw new errors_1.RetryableError('Rate limit exceeded', error);
                }
                throw error;
            }
        });
    }
    async listDomainForSale(domain, options) {
        const browser = await puppeteer_1.default.launch();
        const page = await browser.newPage();
        try {
            const credentials = await this.credentialsManager.getCredentials('godaddy');
            if (!credentials) {
                throw new Error('No GoDaddy credentials found');
            }
            await page.goto('https://sso.godaddy.com/login?realm=idp&path=%2Fproducts&app=account');
            // Type credentials
            await page.type('#username', credentials.username);
            await page.type('#password', credentials.password);
            // Click login and wait for navigation
            await Promise.all([page.waitForNavigation(), page.click('#submitBtn')]);
            // Go to domain manager
            await page.goto(`https://dcc.godaddy.com/domain-manager/sell/${domain}`);
            // Fill listing details
            await page.waitForSelector('input[name="price"]');
            await page.type('input[name="price"]', options.price.toString());
            await page.waitForSelector('textarea[name="description"]');
            await page.type('textarea[name="description"]', options.description);
            // Submit listing
            await Promise.all([page.waitForNavigation(), page.click('button[type="submit"]')]);
            return { success: true, domain, price: options.price };
        }
        catch (error) {
            logger_1.logger.error('Error listing domain for sale:', error);
            throw error;
        }
        finally {
            await browser.close();
        }
    }
    async updatePaymentMethod(paymentInfo) {
        const browser = await puppeteer_1.default.launch();
        const page = await browser.newPage();
        try {
            const credentials = await this.credentialsManager.getCredentials('godaddy');
            if (!credentials) {
                throw new Error('No GoDaddy credentials found');
            }
            // Login
            await page.goto('https://sso.godaddy.com/login?realm=idp&path=%2Fproducts&app=account');
            await page.type('#username', credentials.username);
            await page.type('#password', credentials.password);
            await Promise.all([page.waitForNavigation(), page.click('#submitBtn')]);
            // Go to payment methods
            await page.goto('https://account.godaddy.com/billing');
            await page.waitForSelector('button[data-testid="add-payment-method"]');
            await page.click('button[data-testid="add-payment-method"]');
            // Fill payment form
            await page.waitForSelector('input[name="cardNumber"]');
            await page.type('input[name="cardNumber"]', paymentInfo.cardNumber);
            await page.type('input[name="expiryMonth"]', paymentInfo.expiryMonth);
            await page.type('input[name="expiryYear"]', paymentInfo.expiryYear);
            await page.type('input[name="cvv"]', paymentInfo.cvv);
            await page.type('input[name="firstName"]', paymentInfo.firstName);
            await page.type('input[name="lastName"]', paymentInfo.lastName);
            await page.type('input[name="address"]', paymentInfo.address);
            await page.type('input[name="city"]', paymentInfo.city);
            await page.type('input[name="state"]', paymentInfo.state);
            await page.type('input[name="zip"]', paymentInfo.zip);
            // Submit form
            await Promise.all([
                page.waitForNavigation(),
                page.click('button[type="submit"]')
            ]);
            // Check for success message
            const success = await page.evaluate(() => {
                const element = document.querySelector('.success-message');
                return element !== null;
            });
            return success;
        }
        catch (error) {
            logger_1.logger.error('Error updating payment method:', error);
            throw error;
        }
        finally {
            await browser.close();
        }
    }
}
exports.GoDaddyConnector = GoDaddyConnector;
//# sourceMappingURL=godaddyConnector.js.map