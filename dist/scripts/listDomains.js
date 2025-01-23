"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const axios_1 = __importDefault(require("axios"));
async function listDomains() {
    const apiKey = process.env.GODADDY_API_KEY;
    const apiSecret = process.env.GODADDY_API_SECRET;
    if (!apiKey || !apiSecret) {
        console.error('GoDaddy API credentials not found in environment variables');
        process.exit(1);
    }
    const axiosInstance = axios_1.default.create({
        baseURL: 'https://api.godaddy.com/v1',
        headers: {
            Authorization: `sso-key ${apiKey}:${apiSecret}`,
            'Content-Type': 'application/json',
        },
    });
    try {
        console.log('Fetching domain list...');
        const response = await axiosInstance.get('/domains');
        const domains = response.data;
        console.log('\nDomain Analysis Report:');
        console.log('=====================\n');
        domains.forEach((domain) => {
            console.log(`Domain: ${domain.domain}`);
            console.log(`Status: ${domain.status}`);
            console.log(`Expires: ${domain.expires}`);
            console.log('-------------------\n');
        });
        return domains;
    }
    catch (error) {
        console.error('Error listing domains:', error);
        if (axios_1.default.isAxiosError(error) && error.response) {
            console.error('API Error:', error.response.data);
        }
        throw error;
    }
}
// Run it
listDomains().catch(console.error);
//# sourceMappingURL=listDomains.js.map