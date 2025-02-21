import { ConfigService } from '../config';
export declare class OpenAIService {
    private apiKey;
    constructor(config?: ConfigService);
    analyzeDemand(content: string): Promise<any>;
}
