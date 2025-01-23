"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const demandScraper_1 = require("../../services/demandScraper");
async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    try {
        const { subreddit, query } = req.body;
        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }
        const scraper = new demandScraper_1.DemandScraper();
        await scraper.initialize();
        const signals = await scraper.scrapeReddit(subreddit || 'all', query);
        await scraper.close();
        return res.status(200).json({
            subreddit: subreddit || 'all',
            query,
            signals,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Error scraping demand:', error);
        return res.status(500).json({ error: error.message });
    }
}
//# sourceMappingURL=scrape-demand.js.map