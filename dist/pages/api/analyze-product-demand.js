"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const demandScraper_1 = require("../../services/demandScraper");
const demandValidator_1 = require("../../services/mvp/demandValidator");
async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    try {
        const { productId, productName, subreddit } = req.body;
        if (!productId || !productName) {
            return res.status(400).json({ error: 'Product information is required' });
        }
        // Initialize scraper
        const scraper = new demandScraper_1.DemandScraper();
        await scraper.initialize();
        // Search for product-specific demand signals
        const searchQueries = [
            `${productName} review`,
            `${productName} recommendation`,
            `${productName} worth it`,
            `alternative to ${productName}`,
            `${productName} vs`,
        ];
        const allSignals = [];
        for (const query of searchQueries) {
            const signals = await scraper.scrapeReddit(subreddit || 'all', query);
            allSignals.push(...signals);
        }
        // Validate and score signals
        const validator = demandValidator_1.DemandValidator.getInstance();
        const validatedSignals = await Promise.all(allSignals.map(async (signal) => {
            const validation = await validator.validateDemand(signal.content);
            return {
                ...signal,
                validation,
                relevance: validation.confidence,
            };
        }));
        // Calculate overall demand score
        const demandScore = validatedSignals.reduce((acc, signal) => {
            return acc + signal.validation.confidence * signal.validation.strength;
        }, 0) / validatedSignals.length;
        await scraper.close();
        return res.status(200).json({
            productId,
            productName,
            timestamp: new Date().toISOString(),
            demandScore,
            signals: validatedSignals.map((signal) => ({
                source: signal.source,
                relevance: signal.relevance,
                keyPoints: signal.keyPoints || [],
                pricePoints: signal.pricePoints || [],
                sentiment: signal.sentiment,
                validation: signal.validation,
            })),
        });
    }
    catch (error) {
        console.error('Error analyzing product demand:', error);
        return res.status(500).json({ error: error.message });
    }
}
//# sourceMappingURL=analyze-product-demand.js.map