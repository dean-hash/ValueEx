import { NextApiRequest, NextApiResponse } from 'next';
import { DigitalIntelligence } from '../../services/digitalIntelligence';
import { DemandValidator } from '../../services/mvp/demandValidator';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const intelligence = new DigitalIntelligence();
    const validator = DemandValidator.getInstance();

    const analysis = await intelligence.analyzeNeed(content);
    const validation = await validator.validateDemand(content);

    return res.status(200).json({ analysis, validation });
  } catch (error: any) {
    console.error('Error analyzing demand:', error);
    return res.status(500).json({ error: error.message });
  }
}
