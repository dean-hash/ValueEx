import { logger } from '../../utils/logger';
import { BusinessNeed } from '../../types/affiliate';

export class FiverrAffiliateService {
  private static instance: FiverrAffiliateService;
  private readonly affiliateId = '1064652';
  private readonly links = {
    marketplace: 'https://go.fiverr.com/visit/?bta=1064652&brand=fiverrmktplace',
    pro: 'https://go.fiverr.com/visit/?bta=1064652&brand=fp',
    logoMaker: 'https://go.fiverr.com/visit/?bta=1064652&brand=logomaker',
    subAffiliates: 'https://go.fiverr.com/visit/?bta=1064652&brand=fiveraffiliates',
  };

  private constructor() {}

  public static getInstance(): FiverrAffiliateService {
    if (!FiverrAffiliateService.instance) {
      FiverrAffiliateService.instance = new FiverrAffiliateService();
    }
    return FiverrAffiliateService.instance;
  }

  async createLandingPage(domain: string, title: string, description: string): Promise<string> {
    try {
      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            padding: 40px 0;
        }
        .services {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            padding: 20px;
        }
        .service-card {
            border: 1px solid #eee;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            transition: transform 0.2s;
        }
        .service-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .cta-button {
            display: inline-block;
            padding: 12px 24px;
            background: #1dbf73;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
            margin-top: 15px;
        }
        .cta-button:hover {
            background: #19a463;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${title}</h1>
        <p>${description}</p>
    </div>
    <div class="services">
        <div class="service-card">
            <h2>Professional Services Marketplace</h2>
            <p>Find expert freelancers for any project. Quality work at competitive prices.</p>
            <a href="${this.links.marketplace}" class="cta-button">Explore Services</a>
        </div>
        <div class="service-card">
            <h2>Premium Business Solutions</h2>
            <p>Top-tier professionals for enterprise-level projects and consulting.</p>
            <a href="${this.links.pro}" class="cta-button">Find Pro Services</a>
        </div>
        <div class="service-card">
            <h2>Professional Logo Design</h2>
            <p>Create stunning logos instantly with our AI-powered design tool.</p>
            <a href="${this.links.logoMaker}" class="cta-button">Design Your Logo</a>
        </div>
    </div>
</body>
</html>`;

      // In production, this would save the HTML to a file and set up hosting
      logger.info(`Landing page generated for ${domain}`);
      return html;
    } catch (error) {
      logger.error(`Failed to create landing page for ${domain}:`, error);
      throw error;
    }
  }

  getAffiliateLinks() {
    return this.links;
  }
}
