import { NextApiRequest, NextApiResponse } from 'next';
import { GoDaddyConnector } from '../../../src/services/connectors/godaddyConnector';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const connector = GoDaddyConnector.getInstance();
    const domains = await connector.listDomains();
    res.status(200).json(domains);
  } catch (error) {
    console.error('Error fetching domains:', error);
    res.status(500).json({ message: 'Error fetching domains' });
  }
}
