import { ValueMetrics } from '../../types/metrics';
export declare class DirectMerchantAPI {
    getProducts(): Promise<any[]>;
    trackEngagement(data: any): Promise<void>;
    recordConversion(data: any): Promise<ValueMetrics>;
}
