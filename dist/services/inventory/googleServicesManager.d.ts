interface GoogleService {
    name: string;
    type: 'API' | 'Platform' | 'Model' | 'Tool';
    status: 'Active' | 'Inactive' | 'Pending';
    credentials?: {
        clientId?: string;
        clientSecret?: string;
        apiKey?: string;
    };
    cost: {
        type: 'Free' | 'Paid' | 'Enterprise';
        monthlyEstimate?: number;
    };
}
export declare class GoogleServicesManager {
    private dynamics;
    private bc;
    private services;
    constructor();
    private initializeServices;
    private addService;
    private trackInBusinessSystems;
    getActiveServices(): Promise<GoogleService[]>;
    getCostAnalysis(): Promise<{
        totalMonthlyCost: number;
        serviceBreakdown: Record<string, number>;
    }>;
    optimizeServices(): Promise<{
        recommendations: string[];
        potentialSavings: number;
    }>;
}
export {};
