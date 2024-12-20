import { logger } from '../utils/logger';

interface DataUsageTerms {
    purpose: string;
    dataPoints: string[];
    duration: number;
    restrictions: string[];
}

interface ContractParty {
    id: string;
    role: 'provider' | 'processor' | 'controller';
    responsibilities: string[];
}

export class DataContractManager {
    private activeContracts = new Map<string, {
        terms: DataUsageTerms;
        parties: ContractParty[];
        status: 'active' | 'expired' | 'terminated';
        created: Date;
        expires: Date;
    }>();

    async createContract(
        terms: DataUsageTerms,
        parties: ContractParty[]
    ): Promise<string> {
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
            expires: new Date(Date.now() + (terms.duration * 24 * 60 * 60 * 1000))
        });

        // Log contract creation
        logger.info(`Data contract ${contractId} created with ${parties.length} parties`);
        logger.info(`Purpose: ${terms.purpose}`);
        logger.info(`Data points: ${terms.dataPoints.join(', ')}`);
        logger.info(`Duration: ${terms.duration} days`);

        return contractId;
    }

    async validateDataUse(
        contractId: string,
        requestedPurpose: string,
        requestedData: string[]
    ): Promise<boolean> {
        const contract = this.activeContracts.get(contractId);
        
        if (!contract || contract.status !== 'active') {
            logger.warn(`Invalid or inactive contract: ${contractId}`);
            return false;
        }

        // Check if contract is expired
        if (contract.expires < new Date()) {
            contract.status = 'expired';
            logger.warn(`Contract ${contractId} has expired`);
            return false;
        }

        // Validate purpose
        if (contract.terms.purpose !== requestedPurpose) {
            logger.warn(`Purpose mismatch for contract ${contractId}`);
            return false;
        }

        // Validate data points
        const unauthorizedData = requestedData.filter(
            point => !contract.terms.dataPoints.includes(point)
        );

        if (unauthorizedData.length > 0) {
            logger.warn(`Unauthorized data points requested: ${unauthorizedData.join(', ')}`);
            return false;
        }

        return true;
    }

    async terminateContract(contractId: string, reason: string): Promise<void> {
        const contract = this.activeContracts.get(contractId);
        
        if (contract) {
            contract.status = 'terminated';
            logger.info(`Contract ${contractId} terminated: ${reason}`);
        }
    }

    private validateTerms(terms: DataUsageTerms): void {
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
        terms.restrictions.forEach(restriction => {
            if (!this.isValidRestriction(restriction)) {
                throw new Error(`Invalid restriction: ${restriction}`);
            }
        });
    }

    private isValidRestriction(restriction: string): boolean {
        const validRestrictions = [
            'no_sharing',
            'internal_only',
            'anonymized_only',
            'aggregate_only',
            'no_storage'
        ];
        return validRestrictions.includes(restriction);
    }

    getContractTerms(contractId: string): DataUsageTerms | null {
        const contract = this.activeContracts.get(contractId);
        return contract ? contract.terms : null;
    }

    getContractStatus(contractId: string): 'active' | 'expired' | 'terminated' | null {
        const contract = this.activeContracts.get(contractId);
        return contract ? contract.status : null;
    }
}
