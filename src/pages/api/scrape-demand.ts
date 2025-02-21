import { NextApiRequest, NextApiResponse } from 'next';
import { DemandScraper } from '../../services/demandScraper';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { subreddit, query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const scraper = new DemandScraper();
    await scraper.initialize();

    const signals = await scraper.scrapeReddit(subreddit || 'all', query);
    await scraper.close();

    return res.status(200).json({
      subreddit: subreddit || 'all',
      query,
      signals,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error scraping demand:', error);
    return res.status(500).json({ error: error.message });
  }
}
