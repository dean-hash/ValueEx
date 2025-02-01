import { DemandInsights } from '../insights/DemandInsights';

interface FiverrService {
  category: string;
  trackingLink: string;
  description: string;
}

const FIVERR_SERVICES: Record<string, FiverrService> = {
  marketplace: {
    category: 'General Marketplace',
    trackingLink: 'https://go.fiverr.com/visit/?bta=1064652&brand=fiverrmktplace',
    description: 'Access thousands of digital services'
  },
  pro: {
    category: 'Professional Services',
    trackingLink: 'https://go.fiverr.com/visit/?bta=1064652&brand=fp',
    description: 'Top-tier professional services'
  },
  logoMaker: {
    category: 'Logo Design',
    trackingLink: 'https://go.fiverr.com/visit/?bta=1064652&brand=logomaker',
    description: 'Create your perfect logo'
  }
};

export class LandingPageGenerator {
  private demandInsights: DemandInsights;

  constructor(demandInsights: DemandInsights) {
    this.demandInsights = demandInsights;
  }

  async generateOptimizedPage(category: string): Promise<string> {
    const service = FIVERR_SERVICES[category];
    if (!service) {
      throw new Error(`Invalid category: ${category}`);
    }

    // Get relevant market insights
    const trends = await this.demandInsights.getTrends();
    const signals = await this.demandInsights.getLatestSignals();
    
    // Filter insights relevant to this category
    const relevantTrends = trends.filter(trend => 
      trend.name.toLowerCase().includes(category.toLowerCase())
    );

    const relevantSignals = signals.filter(signal =>
      signal.name.toLowerCase().includes(category.toLowerCase())
    );

    // Generate optimized content
    const content = this.generateContent(service, relevantTrends, relevantSignals);
    
    return content;
  }

  private generateContent(
    service: FiverrService,
    trends: any[],
    signals: any[]
  ): string {
    const trendingFeatures = trends
      .map(t => t.name)
      .slice(0, 3)
      .join(', ');

    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Top ${service.category} Services - Limited Time Offer</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .cta-button {
            display: inline-block;
            background: #1dbf73;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
        }
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .feature {
            padding: 20px;
            background: #f9f9f9;
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Premium ${service.category} Services</h1>
        <p class="highlight">Trending now: ${trendingFeatures}</p>
        
        <div class="features">
            <div class="feature">
                <h3>Expert Providers</h3>
                <p>Work with top-rated professionals</p>
            </div>
            <div class="feature">
                <h3>Guaranteed Quality</h3>
                <p>100% satisfaction guarantee</p>
            </div>
            <div class="feature">
                <h3>Fast Delivery</h3>
                <p>Quick turnaround times</p>
            </div>
        </div>

        <p>${service.description}</p>
        
        <a href="${service.trackingLink}" class="cta-button">
            Get Started Now
        </a>
        
        <p><small>Limited time offer. Prices subject to change.</small></p>
    </div>
</body>
</html>`;

    return html;
  }
}
