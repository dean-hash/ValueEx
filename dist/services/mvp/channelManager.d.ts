import { MVPProduct } from '../../types/mvp/product';
import { DemandSignal } from '../../types/mvp/demand';
export declare class ChannelManager {
    private static instance;
    private channels;
    private deliveryHistory;
    private constructor();
    static getInstance(): ChannelManager;
    private initializeDefaultChannels;
    /**
     * Deliver value proposition and affiliate link through appropriate channels
     */
    deliverMatch(product: MVPProduct, demand: DemandSignal, userId: string): Promise<boolean>;
    private createDeliveryPayload;
    private createValueProposition;
    private createCallToAction;
    private generateAffiliateLink;
    private selectChannels;
    private deliverThroughChannel;
}
