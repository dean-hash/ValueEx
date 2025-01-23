import { ValueMetrics } from '../../../types/metrics';
export declare class MerchantPortal {
    private static instance;
    private api;
    private matchingEngine;
    private constructor();
    static getInstance(): MerchantPortal;
    getOptimalProducts(context?: any): Promise<any[]>;
    trackEngagement(data: any): Promise<void>;
    processConversion(conversionData: any): Promise<ValueMetrics>;
}
