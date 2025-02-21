import { NextResponse } from 'next/server';
import { PortfolioAnalyzer } from '../../../src/services/domain/portfolioAnalyzer';

export async function GET() {
  try {
    const analyzer = PortfolioAnalyzer.getInstance();
    const domains = await analyzer.getDomains();
    return NextResponse.json(domains);
  } catch (error) {
    console.error('Error fetching domains:', error);
    return NextResponse.json({ error: 'Failed to fetch domains' }, { status: 500 });
  }
}
