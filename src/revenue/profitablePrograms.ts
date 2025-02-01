import { AffiliateConnector } from './affiliateConnector';

interface ProgramMetrics {
    id: number;
    name: string;
    sector: string;
    commission: number;
    conversionRate: number;
    averageOrder: number;
    expectedValue: number;
}

interface ServiceMatch {
    keyword: string;
    fiverrLink: string;
    relevance: number;
}

export class ProfitablePrograms {
    private static instance: ProfitablePrograms;
    private connector: AffiliateConnector;

    private constructor() {
        this.connector = AffiliateConnector.getInstance();
    }

    public static getInstance(): ProfitablePrograms {
        if (!ProfitablePrograms.instance) {
            ProfitablePrograms.instance = new ProfitablePrograms();
        }
        return ProfitablePrograms.instance;
    }

    public async getTopAwinPrograms(limit: number = 10): Promise<ProgramMetrics[]> {
        const programs = await this.connector.getAwinPrograms();
        
        // Extract and calculate metrics
        const programMetrics = programs
            .filter(program => program.status === 'Active')
            .map(program => ({
                id: program.id,
                name: program.name,
                sector: program.primarySector,
                commission: program.commission,
                conversionRate: program.conversionRate || 0.02, // Default 2%
                averageOrder: program.averageOrder || this.getAverageOrderByIndustry(program.primarySector),
                expectedValue: (program.commission / 100) * (program.averageOrder || this.getAverageOrderByIndustry(program.primarySector))
            }))
            .filter(program => program.commission > 0); // Only include programs with commission

        // Sort by expected value and return top N
        return programMetrics
            .sort((a, b) => b.expectedValue - a.expectedValue)
            .slice(0, limit);
    }

    private getAverageOrderByIndustry(sector: string): number {
        const averages: { [key: string]: number } = {
            'Health & Beauty': 75,
            'Clothing': 100,
            'Electronics': 200,
            'Home & Garden': 150,
            'Business Services': 500,
            'Education & Training': 300,
            'Software & Technology': 250,
            'Financial Services': 1000,
            'Travel': 800,
            'Sports & Fitness': 120
        };
        return averages[sector] || 100; // Default to $100 if sector not found
    }

    public getFiverrServiceMatches(program: ProgramMetrics): ServiceMatch[] {
        const fiverrLinks = this.connector.getFiverrLinks();
        const matches: ServiceMatch[] = [];

        // Map business sectors to relevant Fiverr services
        const sectorMatches: { [key: string]: { type: string, relevance: number }[] } = {
            'Business Services': [
                { type: 'pro', relevance: 0.9 },
                { type: 'marketplace', relevance: 0.8 }
            ],
            'Software & Technology': [
                { type: 'pro', relevance: 0.95 },
                { type: 'marketplace', relevance: 0.85 }
            ],
            'Marketing & Advertising': [
                { type: 'pro', relevance: 0.9 },
                { type: 'marketplace', relevance: 0.8 }
            ],
            'Creative & Design': [
                { type: 'logo', relevance: 0.95 },
                { type: 'marketplace', relevance: 0.9 }
            ]
        };

        // Add sector-specific matches
        if (program.sector in sectorMatches) {
            sectorMatches[program.sector].forEach(match => {
                const link = match.type === 'pro' ? fiverrLinks.pro :
                           match.type === 'logo' ? fiverrLinks.logoMaker :
                           fiverrLinks.marketplace;
                           
                matches.push({
                    keyword: `${program.sector} services`,
                    fiverrLink: link,
                    relevance: match.relevance
                });
            });
        }

        // Always add marketplace as a fallback
        if (!matches.length) {
            matches.push({
                keyword: 'general services',
                fiverrLink: fiverrLinks.marketplace,
                relevance: 0.7
            });
        }

        return matches.sort((a, b) => b.relevance - a.relevance);
    }

    public async generateRevenueOpportunities() {
        try {
            // Get top Awin programs
            const topPrograms = await this.getTopAwinPrograms(5);
            console.log('Top Awin Programs:', topPrograms);

            // Generate relevant Fiverr matches for each program
            const opportunities = topPrograms.map(program => {
                const fiverrMatches = this.getFiverrServiceMatches(program);
                return {
                    program,
                    fiverrMatches,
                    totalOpportunity: program.expectedValue * Math.max(...fiverrMatches.map(m => m.relevance))
                };
            });

            return opportunities.sort((a, b) => b.totalOpportunity - a.totalOpportunity);
        } catch (error) {
            console.error('Error generating revenue opportunities:', error);
            throw error;
        }
    }
}
