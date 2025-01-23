"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataContractManager = void 0;
const logger_1 = require("../utils/logger");
class DataContractManager {
    constructor() {
        this.activeContracts = new Map();
    }
    async createContract(terms, parties) {
        // Generate unique contract ID
        const contractId = `contract_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        // Validate terms
        this.validateTerms(terms);
        // Create contract
        this.activeContracts.set(contractId, {
            terms,
            parties,
            status: 'active',
            created: new Date(),
            expires: new Date(Date.now() + terms.duration * 24 * 60 * 60 * 1000),
        });
        // Log contract creation
        logger_1.logger.info(`Data contract ${contractId} created with ${parties.length} parties`);
        logger_1.logger.info(`Purpose: ${terms.purpose}`);
        logger_1.logger.info(`Data points: ${terms.dataPoints.join(', ')}`);
        logger_1.logger.info(`Duration: ${terms.duration} days`);
        return contractId;
    }
    async validateDataUse(contractId, requestedPurpose, requestedData) {
        const contract = this.activeContracts.get(contractId);
        if (!contract || contract.status !== 'active') {
            logger_1.logger.warn(`Invalid or inactive contract: ${contractId}`);
            return false;
        }
        // Check if contract is expired
        if (contract.expires < new Date()) {
            contract.status = 'expired';
            logger_1.logger.warn(`Contract ${contractId} has expired`);
            return false;
        }
        // Validate purpose
        if (contract.terms.purpose !== requestedPurpose) {
            logger_1.logger.warn(`Purpose mismatch for contract ${contractId}`);
            return false;
        }
        // Validate data points
        const unauthorizedData = requestedData.filter((point) => !contract.terms.dataPoints.includes(point));
        if (unauthorizedData.length > 0) {
            logger_1.logger.warn(`Unauthorized data points requested: ${unauthorizedData.join(', ')}`);
            return false;
        }
        return true;
    }
    async terminateContract(contractId, reason) {
        const contract = this.activeContracts.get(contractId);
        if (contract) {
            contract.status = 'terminated';
            logger_1.logger.info(`Contract ${contractId} terminated: ${reason}`);
        }
    }
    validateTerms(terms) {
        // Validate purpose
        if (!terms.purpose || terms.purpose.trim().length === 0) {
            throw new Error('Purpose must be specified');
        }
        // Validate duration
        if (terms.duration <= 0) {
            throw new Error('Duration must be positive');
        }
        // Validate data points
        if (!terms.dataPoints || terms.dataPoints.length === 0) {
            throw new Error('At least one data point must be specified');
        }
        // Validate restrictions
        terms.restrictions.forEach((restriction) => {
            if (!this.isValidRestriction(restriction)) {
                throw new Error(`Invalid restriction: ${restriction}`);
            }
        });
    }
    isValidRestriction(restriction) {
        const validRestrictions = [
            'no_sharing',
            'internal_only',
            'anonymized_only',
            'aggregate_only',
            'no_storage',
        ];
        return validRestrictions.includes(restriction);
    }
    getContractTerms(contractId) {
        const contract = this.activeContracts.get(contractId);
        return contract ? contract.terms : null;
    }
    getContractStatus(contractId) {
        const contract = this.activeContracts.get(contractId);
        return contract ? contract.status : null;
    }
}
exports.DataContractManager = DataContractManager;
//# sourceMappingURL=dataContractManager.js.map