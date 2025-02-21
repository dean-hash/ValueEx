"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoDaddyConnector = void 0;
const axios_1 = __importDefault(require("axios"));
class GoDaddyConnector {
    constructor(config) {
        this.baseUrl = 'https://api.godaddy.com/v1';
        const godaddyConfig = config.get('godaddy');
        this.apiKey = godaddyConfig.apiKey;
        this.apiSecret = godaddyConfig.apiSecret;
    }
    getHeaders() {
        return {
            Authorization: `sso-key ${this.apiKey}:${this.apiSecret}`,
            'Content-Type': 'application/json',
        };
    }
    async checkDomainAvailability(domainName) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/domains/available?domain=${domainName}`, {
                headers: this.getHeaders(),
            });
            return {
                available: response.data.available,
                price: response.data.price,
            };
        }
        catch (error) {
            throw new Error(`Failed to check domain availability: ${error.message}`);
        }
    }
    async purchaseDomain(domainName) {
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/domains/purchase`, { domain: domainName }, { headers: this.getHeaders() });
            return response.status === 200;
        }
        catch (error) {
            throw new Error(`Failed to purchase domain: ${error.message}`);
        }
    }
    async configureDNS(domainName, records) {
        try {
            const response = await axios_1.default.put(`${this.baseUrl}/domains/${domainName}/records`, records, {
                headers: this.getHeaders(),
            });
            return response.status === 200;
        }
        catch (error) {
            throw new Error(`Failed to configure DNS: ${error.message}`);
        }
    }
}
exports.GoDaddyConnector = GoDaddyConnector;
//# sourceMappingURL=godaddy.js.map