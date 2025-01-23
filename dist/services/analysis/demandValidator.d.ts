import { DemandValidation } from '../../types/demandTypes';
import { ConfigService } from '../config';
import { Logger } from '../../utils/logger';
export declare class DemandValidator {
    private openai;
    private logger;
    constructor(config?: ConfigService, logger?: Logger);
    validateDemand(content: string): Promise<DemandValidation>;
    private calculateConfidence;
    private calculateTextQuality;
    private calculateCommunityEngagement;
    private calculateAuthorCredibility;
    private calculateContentRelevance;
    private calculateTemporalRelevance;
}
