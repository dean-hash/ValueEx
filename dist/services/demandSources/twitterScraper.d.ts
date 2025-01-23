import { DemandSource } from './demandSourceManager';
import { ScrapedDemandSignal } from '../../types/demandTypes';
export declare class TwitterScraper implements DemandSource {
    name: string;
    weight: number;
    scrape(query: string, options?: any): Promise<ScrapedDemandSignal[]>;
    validateSignal(signal: ScrapedDemandSignal): boolean;
}
