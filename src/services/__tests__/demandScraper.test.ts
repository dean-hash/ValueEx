import { DemandScraper } from '../demandScraper';
import { ScrapedDemandSignal } from '../../types/demandTypes';

describe('DemandScraper', () => {
    let scraper: DemandScraper;

    beforeEach(() => {
        scraper = new DemandScraper();
    });

    it('should scrape demand signals with confidence scoring', async () => {
        const signals = await scraper.scrapeReddit('technology', 'looking for software recommendation');
        
        expect(signals.length).toBeGreaterThan(0);
        
        const signal = signals[0];
        expect(signal).toHaveProperty('confidence');
        expect(signal.confidence.overall).toBeGreaterThanOrEqual(0);
        expect(signal.confidence.overall).toBeLessThanOrEqual(1);
        
        // Verify confidence factors
        expect(signal.confidence.factors).toHaveProperty('textQuality');
        expect(signal.confidence.factors).toHaveProperty('communityEngagement');
        expect(signal.confidence.factors).toHaveProperty('authorCredibility');
        expect(signal.confidence.factors).toHaveProperty('contentRelevance');
        expect(signal.confidence.factors).toHaveProperty('temporalRelevance');
    });

    it('should extract meaningful topics', async () => {
        const signals = await scraper.scrapeReddit('technology', 'need recommendation for project management software');
        
        expect(signals.length).toBeGreaterThan(0);
        
        const signal = signals[0];
        expect(signal.analysis.topics.length).toBeGreaterThan(0);
        
        const topics = signal.analysis.topics;
        expect(topics[0]).toHaveProperty('name');
        expect(topics[0]).toHaveProperty('confidence');
        expect(topics[0]).toHaveProperty('keywords');
        expect(topics[0].confidence).toBeGreaterThan(0);
    });

    it('should calculate accurate sentiment scores', async () => {
        const signals = await scraper.scrapeReddit('technology', 'best software recommendations');
        
        expect(signals.length).toBeGreaterThan(0);
        
        const signal = signals[0];
        expect(signal.analysis.sentiment).toBeGreaterThanOrEqual(-1);
        expect(signal.analysis.sentiment).toBeLessThanOrEqual(1);
    });

    it('should handle errors gracefully', async () => {
        const signals = await scraper.scrapeReddit('!@#$%^&*()', '!@#$%^&*()');
        const metrics = scraper.getMetrics();
        
        expect(signals.length).toBe(0);
        expect(metrics.signalsInvalid).toBe(0);
    });

    it('should respect rate limits', async () => {
        const promises = Array(5).fill(null).map(() => 
            scraper.scrapeReddit('technology', 'software recommendation')
        );
        
        const results = await Promise.all(promises);
        const metrics = scraper.getMetrics();
        
        expect(results.every(signals => signals.length > 0)).toBe(true);
        expect(metrics.requestsError).toBe(0);
    });

    it('should provide comprehensive metadata', async () => {
        const signals = await scraper.scrapeReddit('technology', 'software recommendation');
        
        expect(signals.length).toBeGreaterThan(0);
        
        const signal = signals[0];
        expect(signal.metadata).toHaveProperty('processingTime');
        expect(signal.metadata).toHaveProperty('extractionVersion');
        expect(signal.metadata).toHaveProperty('dataQualityScore');
        expect(signal.metadata.dataQualityScore).toBeGreaterThanOrEqual(0);
        expect(signal.metadata.dataQualityScore).toBeLessThanOrEqual(1);
    });
});
