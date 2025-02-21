"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const godaddyConnector_1 = require("../services/domain/connectors/godaddyConnector");
const logger_1 = require("../utils/logger");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
async function setupDomainSales() {
    const connector = godaddyConnector_1.GoDaddyConnector.getInstance();
    try {
        // Get list of owned domains
        console.log('\nFetching owned domains...');
        const ownedDomains = await connector.getDomains();
        console.log('Owned domains:', ownedDomains);
        // Prepare landing page files
        const landingPath = path.join(process.cwd(), 'src', 'landing', 'alerion');
        if (!fs.existsSync(landingPath)) {
            fs.mkdirSync(landingPath, { recursive: true });
        }
        logger_1.logger.info('Landing page files prepared');
        // List domains for sale
        const domains = [
            {
                domain: 'alerion.ai',
                price: 3500,
                description: 'Premium AI domain, perfect for AI/ML startups',
            },
            {
                domain: 'divvy.city',
                price: 1200,
                description: 'Premium city-focused fintech domain',
            },
            {
                domain: 'divvy.earth',
                price: 1500,
                description: 'Global fintech/sustainability domain',
            },
            {
                domain: 'divvy.news',
                price: 900,
                description: 'Perfect for financial news/media',
            },
            {
                domain: 'divvy.one',
                price: 2000,
                description: 'Premium short domain for fintech platform',
            },
            {
                domain: 'divvy.zone',
                price: 800,
                description: 'Ideal for fintech community platform',
            },
        ];
        console.log('\nListing Domains for Sale:');
        console.log('========================');
        for (const domain of domains) {
            if (!ownedDomains.includes(domain.domain)) {
                console.log(`⚠ Skipping ${domain.domain} - not owned`);
                continue;
            }
            try {
                await connector.listDomainForSale(domain.domain, {
                    price: domain.price,
                    description: domain.description,
                });
                console.log(`✓ Listed ${domain.domain} for $${domain.price}`);
            }
            catch (error) {
                console.error(`✗ Failed to list ${domain.domain}:`, error?.message || 'Unknown error');
            }
        }
        console.log('\nNext Steps:');
        console.log('1. Set up GitHub Pages repository');
        console.log('2. Configure GitHub Pages DNS settings');
        console.log('3. Monitor domain sale listings');
    }
    catch (error) {
        logger_1.logger.error('Error in setup:', error);
        throw error;
    }
}
setupDomainSales();
//# sourceMappingURL=deployLandingPages.js.map