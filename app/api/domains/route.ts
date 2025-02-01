import { NextResponse } from 'next/server';
import { PortfolioAnalyzer } from '@/services/domain/portfolioAnalyzer';

export async function GET() {
  try {
    const analyzer = new PortfolioAnalyzer();
    const domains = await analyzer.getAllDomains();
    return NextResponse.json({ domains });
  } catch (error) {
    console.error('Error fetching domains:', error);
    return NextResponse.json({ error: 'Failed to fetch domains' }, { status: 500 });
  }
}
