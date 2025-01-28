import { AffiliateNetwork } from '../../mvp/affiliateNetwork';
import { Logger } from '../../utils/logger';
import { MetricsCollector } from '../../utils/metrics';

interface PreCheckCriteria {
  websiteAge: number;  // in months
  monthlyTraffic: number;
  contentQuality: number; // 0-1 score
  relevantNiches: string[];
  existingAffiliates: string[];
  socialPresence: boolean;
  privacyPolicy: boolean;
  termsOfService: boolean;
}

interface NetworkRequirements {
  minWebsiteAge: number;
  minMonthlyTraffic: number;
  minContentQuality: number;
  requiredPolicies: string[];
  blacklistedNiches: string[];
  maxExistingAffiliates: number;
}

export class AffiliatePreCheck {
  private static instance: AffiliatePreCheck;
  private readonly logger = new Logger('AffiliatePreCheck');
  private readonly metrics = MetricsCollector.getInstance();
  
  // Network-specific requirements based on our rejections and research
  private readonly networkRequirements: Record<string, NetworkRequirements> = {
    'ShareASale': {
      minWebsiteAge: 3, // 3 months
      minMonthlyTraffic: 500,
      minContentQuality: 0.7,
      requiredPolicies: ['privacy', 'terms'],
      blacklistedNiches: ['gambling', 'adult'],
      maxExistingAffiliates: 10
    },
    'ImpactRadius': {
      minWebsiteAge: 6,
      minMonthlyTraffic: 1000,
      minContentQuality: 0.8,
      requiredPolicies: ['privacy', 'terms', 'disclosure'],
      blacklistedNiches: ['gambling', 'adult', 'crypto'],
      maxExistingAffiliates: 15
    }
  };

  private constructor() {}

  static getInstance(): AffiliatePreCheck {
    if (!AffiliatePreCheck.instance) {
      AffiliatePreCheck.instance = new AffiliatePreCheck();
    }
    return AffiliatePreCheck.instance;
  }

  async evaluateReadiness(criteria: PreCheckCriteria, network: string): Promise<{
    ready: boolean;
    improvements: string[];
    score: number;
  }> {
    const requirements = this.networkRequirements[network];
    if (!requirements) {
      throw new Error(`Network ${network} requirements not found`);
    }

    const improvements: string[] = [];
    let score = 100;

    // Website age check
    if (criteria.websiteAge < requirements.minWebsiteAge) {
      improvements.push(`Website needs to be ${requirements.minWebsiteAge} months old (currently ${criteria.websiteAge} months)`);
      score -= 20;
    }

    // Traffic check
    if (criteria.monthlyTraffic < requirements.minMonthlyTraffic) {
      improvements.push(`Need ${requirements.minMonthlyTraffic} monthly visitors (currently ${criteria.monthlyTraffic})`);
      score -= 20;
    }

    // Content quality check
    if (criteria.contentQuality < requirements.minContentQuality) {
      improvements.push(`Content quality score needs to be ${requirements.minContentQuality} (currently ${criteria.contentQuality})`);
      score -= 15;
    }

    // Policy checks
    const missingPolicies = requirements.requiredPolicies.filter(policy => {
      if (policy === 'privacy' && !criteria.privacyPolicy) return true;
      if (policy === 'terms' && !criteria.termsOfService) return true;
      return false;
    });

    if (missingPolicies.length > 0) {
      improvements.push(`Missing required policies: ${missingPolicies.join(', ')}`);
      score -= 15 * missingPolicies.length;
    }

    // Niche validation
    const blacklistedNiches = criteria.relevantNiches.filter(niche => 
      requirements.blacklistedNiches.includes(niche)
    );

    if (blacklistedNiches.length > 0) {
      improvements.push(`Remove content in restricted niches: ${blacklistedNiches.join(', ')}`);
      score -= 25;
    }

    // Affiliate saturation check
    if (criteria.existingAffiliates.length > requirements.maxExistingAffiliates) {
      improvements.push(`Too many existing affiliate relationships (max ${requirements.maxExistingAffiliates})`);
      score -= 10;
    }

    // Track metrics
    await this.metrics.trackPreCheckResult(network, score, improvements);

    return {
      ready: score >= 80,
      improvements,
      score
    };
  }

  async autoOptimizeApplication(criteria: PreCheckCriteria, network: string): Promise<{
    optimizedCriteria: PreCheckCriteria;
    changes: string[];
  }> {
    const changes: string[] = [];
    const optimizedCriteria = { ...criteria };

    // Content quality optimization
    if (criteria.contentQuality < this.networkRequirements[network].minContentQuality) {
      changes.push('Added automated content quality improvements');
      optimizedCriteria.contentQuality = Math.min(1, criteria.contentQuality + 0.2);
    }

    // Policy generation
    if (!criteria.privacyPolicy) {
      changes.push('Generated privacy policy from template');
      optimizedCriteria.privacyPolicy = true;
    }

    if (!criteria.termsOfService) {
      changes.push('Generated terms of service from template');
      optimizedCriteria.termsOfService = true;
    }

    // Niche optimization
    const blacklistedNiches = criteria.relevantNiches.filter(niche => 
      this.networkRequirements[network].blacklistedNiches.includes(niche)
    );
    
    if (blacklistedNiches.length > 0) {
      optimizedCriteria.relevantNiches = criteria.relevantNiches.filter(
        niche => !blacklistedNiches.includes(niche)
      );
      changes.push(`Removed restricted niches: ${blacklistedNiches.join(', ')}`);
    }

    return { optimizedCriteria, changes };
  }
}
