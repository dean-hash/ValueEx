"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainEcosystem = void 0;
class DomainEcosystem {
    constructor(config, godaddy, intelligence, visualizer) {
        this.config = config;
        this.godaddy = godaddy;
        this.intelligence = intelligence;
        this.visualizer = visualizer;
    }
    async analyzeDomain(domainName) {
        try {
            const domainInfo = await this.intelligence.analyzeDomain(domainName);
            const state = await this.intelligence.getDomainState();
            await this.intelligence.updateDomainState({
                ...state,
                domains: state.domains.map((d) => (d.name === domainName ? domainInfo : d)),
            });
            return domainInfo;
        }
        catch (error) {
            throw new Error(`Failed to analyze domain: ${error.message}`);
        }
    }
    async checkDomainAvailability(domainName) {
        try {
            return await this.godaddy.checkDomainAvailability(domainName);
        }
        catch (error) {
            throw new Error(`Failed to check domain availability: ${error.message}`);
        }
    }
    async purchaseDomain(domainName) {
        try {
            const availability = await this.checkDomainAvailability(domainName);
            if (!availability.available) {
                throw new Error('Domain is not available');
            }
            const success = await this.godaddy.purchaseDomain(domainName);
            if (success) {
                const state = await this.intelligence.getDomainState();
                const newDomain = {
                    name: domainName,
                    status: 'pending',
                    resonance: 0,
                    metrics: {
                        stability: 0,
                        coherence: 0,
                    },
                };
                await this.intelligence.updateDomainState({
                    ...state,
                    domains: [...state.domains, newDomain],
                });
            }
            return success;
        }
        catch (error) {
            throw new Error(`Failed to purchase domain: ${error.message}`);
        }
    }
}
exports.DomainEcosystem = DomainEcosystem;
//# sourceMappingURL=domainEcosystem.js.map