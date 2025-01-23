import { ScrapedDemandSignal } from '../../types/demandTypes';
export interface DemandSource {
    name: string;
    scrape(query: string, options?: any): Promise<ScrapedDemandSignal[]>;
    validateSignal(signal: ScrapedDemandSignal): boolean;
}
