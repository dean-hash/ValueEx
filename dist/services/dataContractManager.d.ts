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
export declare class DataContractManager {
    private activeContracts;
    createContract(terms: DataUsageTerms, parties: ContractParty[]): Promise<string>;
    validateDataUse(contractId: string, requestedPurpose: string, requestedData: string[]): Promise<boolean>;
    terminateContract(contractId: string, reason: string): Promise<void>;
    private validateTerms;
    private isValidRestriction;
    getContractTerms(contractId: string): DataUsageTerms | null;
    getContractStatus(contractId: string): 'active' | 'expired' | 'terminated' | null;
}
export {};
