import { logger } from '../../utils/logger';
import { BusinessNeed } from '../../types/affiliate';
import { RevenueStreamManager } from '../revenue/revenueStreamManager';
import { QuickWinAnalyzer } from '../../analysis/quickWinAnalyzer';

// These are our actual, working affiliate links
const REAL_AFFILIATE_LINKS = {
  marketplace: 'https://go.fiverr.com/visit/?bta=1064652&brand=fiverrmktplace',
  pro: 'https://go.fiverr.com/visit/?bta=1064652&brand=fp',
  logomaker: 'https://go.fiverr.com/visit/?bta=1064652&brand=logomaker',
  subaffiliates: 'https://go.fiverr.com/visit/?bta=1064652&brand=fiveraffiliates',
};

// Real, working banner iframes
const REAL_BANNERS = {
  subaffiliates:
    '<iframe src="https://fiverr.ck-cdn.com/tn/serve/geoGroup/?rgid=2&bta=1056452" width="300" height="250" frameborder="0" scrolling="no"></iframe>',
  webdev:
    '<iframe src="https://fiverr.ck-cdn.com/tn/serve/geoGroup/?rgid=4&bta=1056452" width="300" height="250" frameborder="0" scrolling="no"></iframe>',
  videoEditing:
    '<iframe src="https://fiverr.ck-cdn.com/tn/serve/geoGroup/?rgid=5&bta=1056452" width="300" height="250" frameborder="0" scrolling="no"></iframe>',
  general:
    '<iframe src="https://fiverr.ck-cdn.com/tn/serve/geoGroup/?rgid=6&bta=1056452" width="300" height="250" frameborder="0" scrolling="no"></iframe>',
  branding:
    '<iframe src="https://fiverr.ck-cdn.com/tn/serve/geoGroup/?rgid=6&bta=1056452" width="300" height="250" frameborder="0" scrolling="no"></iframe>',
};

interface QuickMatchResult {
  affiliateLink: string;
  bannerHtml: string;
  category: string;
  utmParams: string;
  expectedCommission: number;
}

export class QuickStartAffiliate {
  private revenueManager: RevenueStreamManager;
  private quickWinAnalyzer: QuickWinAnalyzer;

  constructor() {
    this.revenueManager = RevenueStreamManager.getInstance();
    this.quickWinAnalyzer = new QuickWinAnalyzer(process.env.AWIN_API_KEY || '');
  }

  // Simple keyword-based matching that works now
  async matchNeedToService(keywords: string[]): Promise<QuickMatchResult> {
    const keywordMap = {
      website: {
        link: REAL_AFFILIATE_LINKS.marketplace,
        banner: REAL_BANNERS.webdev,
        category: 'Web Development',
        avgValue: 150,
      },
      web: {
        link: REAL_AFFILIATE_LINKS.marketplace,
        banner: REAL_BANNERS.webdev,
        category: 'Web Development',
        avgValue: 150,
      },
      wordpress: {
        link: REAL_AFFILIATE_LINKS.marketplace,
        banner: REAL_BANNERS.webdev,
        category: 'Web Development',
        avgValue: 100,
      },
      video: {
        link: REAL_AFFILIATE_LINKS.marketplace,
        banner: REAL_BANNERS.videoEditing,
        category: 'Video Editing',
        avgValue: 80,
      },
      editing: {
        link: REAL_AFFILIATE_LINKS.marketplace,
        banner: REAL_BANNERS.videoEditing,
        category: 'Video Editing',
        avgValue: 80,
      },
      logo: {
        link: REAL_AFFILIATE_LINKS.logomaker,
        banner: REAL_BANNERS.branding,
        category: 'Logo Design',
        avgValue: 50,
      },
      brand: {
        link: REAL_AFFILIATE_LINKS.marketplace,
        banner: REAL_BANNERS.branding,
        category: 'Branding',
        avgValue: 200,
      },
      affiliate: {
        link: REAL_AFFILIATE_LINKS.subaffiliates,
        banner: REAL_BANNERS.subaffiliates,
        category: 'Affiliate Marketing',
        avgValue: 0,
      },
    };

    // Default to marketplace if no specific match
    let result = {
      link: REAL_AFFILIATE_LINKS.marketplace,
      banner: REAL_BANNERS.general,
      category: 'General Services',
      avgValue: 50,
    };

    // Find first matching keyword
    for (const keyword of keywords) {
      const match = Object.entries(keywordMap).find(([key]) => keyword.toLowerCase().includes(key));

      if (match) {
        result = { ...match[1] };
        break;
      }
    }

    // Add UTM parameters
    const utmParams = new URLSearchParams({
      utm_source: 'valuex',
      utm_medium: 'affiliate',
      utm_campaign: result.category.toLowerCase().replace(' ', '_'),
    }).toString();

    // Calculate expected commission (Fiverr typically pays 30% of their 20% fee)
    const expectedCommission = result.avgValue * 0.2 * 0.3;

    return {
      affiliateLink: `${result.link}&${utmParams}`,
      bannerHtml: result.banner,
      category: result.category,
      utmParams,
      expectedCommission,
    };
  }

  // Track actual conversions using our revenue infrastructure
  async trackConversion(result: QuickMatchResult): Promise<void> {
    // Track the revenue event
    await this.revenueManager.trackRevenueEvent({
      source: 'affiliate',
      amount: result.expectedCommission,
      details: {
        platform: 'fiverr',
        category: result.category,
        utmParams: result.utmParams,
        timestamp: new Date().toISOString(),
      },
    });

    // Log for analysis
    logger.info('Affiliate link clicked', {
      category: result.category,
      utmParams: result.utmParams,
      expectedCommission: result.expectedCommission,
      timestamp: new Date().toISOString(),
    });

    // Analyze performance
    const metrics = await this.quickWinAnalyzer.analyzeOpportunity('fiverr', result.category);
    logger.info('Quick win analysis', { metrics });
  }

  // Generate a simple, compliant disclosure
  generateDisclosure(category: string): string {
    return `[Affiliate Disclosure: If you purchase through these links, we may earn a commission from Fiverr. This helps support our platform at no additional cost to you.]`;
  }
}
