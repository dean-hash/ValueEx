interface AlerionService {
    name: string;
    endpoint: string;
    description: string;
    valueProposition: string;
    revenueModel: {
        type: 'subscription' | 'usage' | 'affiliate';
        basePrice: number;
        recurringInterval?: 'monthly' | 'yearly';
    };
}
export declare class AlerionManager {
    private static instance;
    private domain;
    private services;
    private metrics;
    private revenueTracker;
    private valueManifestor;
    private resonanceEngine;
    private constructor();
    static getInstance(): AlerionManager;
    private initializeServices;
    private manifestOpportunity;
    deployService(service: AlerionService): Promise<boolean>;
    deployAllServices(): Promise<{
        deployedServices: number;
        projectedRevenue: number;
    }>;
    getServiceStatus(): Record<string, any>;
}
export {};
