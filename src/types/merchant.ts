export interface CommissionStructure {
    base: number;
    tiered?: { [volume: string]: number };
    special?: string;
    notes?: string;
}

export interface MerchantProfile {
    id: string;
    name: string;
    category: string;
    commissionStructure: CommissionStructure;
    requirements?: string[];
    status: 'active' | 'pending' | 'target';
    notes?: string;
    integrationLevel?: 'basic' | 'advanced' | 'custom';
}