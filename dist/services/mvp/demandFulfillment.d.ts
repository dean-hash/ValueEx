import { MVPProduct } from '../../types/mvp/product';
import { DemandSignal } from '../../types/mvp/demand';
interface FulfillmentStrategy {
    platform: 'reddit' | 'twitter' | 'blog_comment' | 'forum';
    confidence: number;
    valueProposition: string;
    affiliateLink: string;
    context: {
        originalPost?: string;
        relevantThread?: string;
        timing: 'immediate' | 'scheduled';
        engagement: 'direct' | 'contextual';
    };
}
export declare class DemandFulfillment {
    private static instance;
    private constructor();
    static getInstance(): DemandFulfillment;
    /**
     * Create fulfillment strategies for a product-demand match
     */
    createFulfillmentStrategies(product: MVPProduct, demand: DemandSignal): Promise<FulfillmentStrategy[]>;
    private generateValueProposition;
    private generateAffiliateLink;
    private formatForReddit;
    private formatForForum;
    private formatForBlog;
    /**
     * Track fulfillment success
     */
    trackFulfillment(strategy: FulfillmentStrategy, success: boolean, metrics?: {
        clicks?: number;
        conversions?: number;
        revenue?: number;
    }): Promise<void>;
}
export {};
