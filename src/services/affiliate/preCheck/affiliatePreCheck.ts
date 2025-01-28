import { logger } from '../../../utils/logger';
import { MetricsCollector } from '../../../services/metrics/metricsCollector';

interface PreCheckCriteria {
  websiteAge: number;
  monthlyTraffic: number;
  contentQuality: number;
  existingAffiliates: number;
  niche: string[];
  policies: string[];
}

interface NetworkRequirements {
  minWebsiteAge: number;
  minMonthlyTraffic: number;
  minContentQuality: number;
  maxExistingAffiliates: number;
  allowedNiches: string[];
  requiredPolicies: string[];
}

const NETWORK_REQUIREMENTS: Record<string, NetworkRequirements> = {
  Awin: {
    minWebsiteAge: 6,
    minMonthlyTraffic: 10000,
    minContentQuality: 7,
    maxExistingAffiliates: 5,
    allowedNiches: ['tech', 'software', 'ai', 'productivity'],
    requiredPolicies: ['privacy', 'terms', 'disclosure'],
  },
  ShareASale: {
    minWebsiteAge: 3,
    minMonthlyTraffic: 5000,
    minContentQuality: 6,
    maxExistingAffiliates: 10,
    allowedNiches: ['tech', 'software', 'business'],
    requiredPolicies: ['privacy', 'terms'],
  },
  ImpactRadius: {
    minWebsiteAge: 12,
    minMonthlyTraffic: 25000,
    minContentQuality: 8,
    maxExistingAffiliates: 3,
    allowedNiches: ['enterprise', 'ai', 'cloud'],
    requiredPolicies: ['privacy', 'terms', 'disclosure', 'gdpr'],
  },
};

export class AffiliatePreCheck {
  private metrics: MetricsCollector;

  constructor() {
    this.metrics = MetricsCollector.getInstance();
  }

  public checkEligibility(
    criteria: PreCheckCriteria,
    network: string
  ): { eligible: boolean; reasons: string[] } {
    const requirements = NETWORK_REQUIREMENTS[network];
    if (!requirements) {
      return {
        eligible: false,
        reasons: [`Network "${network}" not found`],
      };
    }

    const reasons: string[] = [];

    // Check website age
    if (criteria.websiteAge < requirements.minWebsiteAge) {
      reasons.push(
        `Website needs to be ${requirements.minWebsiteAge} months old (currently ${criteria.websiteAge} months)`
      );
    }

    // Check traffic
    if (criteria.monthlyTraffic < requirements.minMonthlyTraffic) {
      reasons.push(
        `Need ${requirements.minMonthlyTraffic} monthly visitors (currently ${criteria.monthlyTraffic})`
      );
    }

    // Check content quality
    if (criteria.contentQuality < requirements.minContentQuality) {
      reasons.push(
        `Content quality score needs to be ${requirements.minContentQuality} (currently ${criteria.contentQuality})`
      );
    }

    // Check required policies
    const missingPolicies = requirements.requiredPolicies.filter(
      (policy) => !criteria.policies.includes(policy)
    );
    if (missingPolicies.length > 0) {
      reasons.push(`Missing required policies: ${missingPolicies.join(', ')}`);
    }

    // Check niche compatibility
    const hasValidNiche = criteria.niche.some((niche) =>
      requirements.allowedNiches.includes(niche)
    );
    if (!hasValidNiche) {
      reasons.push(`Niche must be one of: ${requirements.allowedNiches.join(', ')}`);
    }

    // Check affiliate count
    if (criteria.existingAffiliates > requirements.maxExistingAffiliates) {
      reasons.push(
        `Too many existing affiliate relationships (max ${requirements.maxExistingAffiliates})`
      );
    }

    const eligible = reasons.length === 0;
    this.trackEligibilityCheck(network, eligible, reasons);

    return { eligible, reasons };
  }

  public async validateCriteria(criteria: PreCheckCriteria): Promise<boolean> {
    try {
      // Validate website age
      if (criteria.websiteAge < 0) {
        throw new Error('Website age cannot be negative');
      }

      // Validate traffic
      if (criteria.monthlyTraffic < 0) {
        throw new Error('Monthly traffic cannot be negative');
      }

      // Validate content quality
      if (criteria.contentQuality < 0 || criteria.contentQuality > 10) {
        throw new Error('Content quality must be between 0 and 10');
      }

      // Validate niche
      const validNiches = new Set([
        'tech',
        'software',
        'ai',
        'cloud',
        'productivity',
        'business',
        'enterprise',
      ]);
      const hasInvalidNiche = criteria.niche.some((niche) => !validNiches.has(niche));
      if (hasInvalidNiche) {
        throw new Error(`Invalid niche. Must be one of: ${Array.from(validNiches).join(', ')}`);
      }

      return true;
    } catch (error) {
      logger.error('Error validating criteria:', error);
      return false;
    }
  }

  private trackEligibilityCheck(network: string, eligible: boolean, reasons: string[]): void {
    this.metrics.trackEvent('affiliate_precheck', {
      network,
      eligible,
      reasonCount: reasons.length,
      timestamp: new Date(),
    });
  }
}
