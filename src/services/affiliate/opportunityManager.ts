import { FiverrAffiliateService } from './fiverrAffiliate';
import { BusinessNeedDetector } from '../social/businessNeedDetector';
import { FreelancerMatcher } from '../matching/freelancerMatcher';
import { logger } from '../../utils/logger';
import { BusinessNeed, FiverrService, SocialPost, JobPosting } from '../../types/affiliate';

interface OpportunityResponse {
  need: BusinessNeed;
  service: FiverrService;
  affiliateLink: string;
  disclosure: string;
  sentiment: number;
  matchAnalysis?: {
    score: number;
    reasons: string[];
    confidenceLevel: number;
  };
}

export class OpportunityManager {
  private fiverrService: FiverrAffiliateService;
  private needDetector: BusinessNeedDetector;
  private freelancerMatcher: FreelancerMatcher;

  constructor() {
    this.fiverrService = new FiverrAffiliateService();
    this.needDetector = new BusinessNeedDetector();
    this.freelancerMatcher = new FreelancerMatcher();
  }

  async processJobPosting(posting: JobPosting): Promise<OpportunityResponse | null> {
    try {
      // Detect business need from job posting
      const need = await this.needDetector.detectNeedsFromJobPosting(posting);
      if (!need) {
        logger.debug('No relevant need detected from job posting', { postingId: posting.id });
        return null;
      }

      return await this.processNeed(need);
    } catch (error) {
      logger.error('Error processing job posting', { error, postingId: posting.id });
      throw error;
    }
  }

  async processSocialPost(post: SocialPost): Promise<OpportunityResponse | null> {
    try {
      // Detect business need from social post
      const need = await this.needDetector.detectNeedsFromSocialPost(post);
      if (!need) {
        logger.debug('No relevant need detected from social post', { postId: post.id });
        return null;
      }

      return await this.processNeed(need);
    } catch (error) {
      logger.error('Error processing social post', { error, postId: post.id });
      throw error;
    }
  }

  private async processNeed(need: BusinessNeed): Promise<OpportunityResponse | null> {
    // Match need to Fiverr service
    const service = await this.fiverrService.matchBusinessNeedToService(need);
    if (!service) {
      logger.debug('No matching service found for need', { needId: need.id });
      return null;
    }

    // Analyze sentiment
    const sentiment = await this.needDetector.analyzeSentiment(need.description);
    if (sentiment < 0.2) {
      logger.debug('Low sentiment score for need', { needId: need.id, sentiment });
      return null;
    }

    // Generate affiliate link and disclosure
    const affiliateLink = this.fiverrService.generateAffiliateLink(service, need.source);
    const disclosure = this.fiverrService.generateDisclosure(service);

    // Track the opportunity
    await this.fiverrService.trackOpportunity(need, service);

    // Get freelancer profiles for this service type
    // This would be implemented in FiverrAffiliateService
    const freelancerProfiles = await this.fiverrService.getTopFreelancers(service.type);

    // Find best matching freelancer
    let bestMatch = null;
    if (freelancerProfiles && freelancerProfiles.length > 0) {
      for (const profile of freelancerProfiles) {
        const match = await this.freelancerMatcher.matchFreelancerToNeed(need, profile);
        if (!bestMatch || match.score > bestMatch.score) {
          bestMatch = match;
        }
      }
    }

    // Return complete response
    const response: OpportunityResponse = {
      need,
      service,
      affiliateLink,
      disclosure,
      sentiment,
      matchAnalysis: bestMatch,
    };

    logger.info('Successfully processed business need', {
      needId: need.id,
      serviceType: service.type,
      sentiment,
      matchScore: bestMatch?.score,
    });

    return response;
  }

  async generateResponse(opportunity: OpportunityResponse): Promise<string> {
    const { need, service, affiliateLink, disclosure, matchAnalysis } = opportunity;

    // Customize response based on source and match analysis
    let response = '';

    if (need.source.includes('linkedin')) {
      response = `Hi ${need.contactInfo?.name || 'there'},\n\n`;
      response += `I noticed you're looking for help with ${need.keywords.join(', ')}. `;

      if (matchAnalysis && matchAnalysis.score > 0.8) {
        response += `I've found an excellent match for your needs! `;
        response += `This freelancer has ${matchAnalysis.reasons[0].toLowerCase()} and ${matchAnalysis.reasons[1].toLowerCase()}. `;
      }

      response += `Based on your requirements, I'd recommend checking out ${service.name}. `;
      response += `They specialize in ${service.description}.\n\n`;
      response += `Here's a direct link to get started: ${affiliateLink}\n\n`;
      response += disclosure;
    } else if (need.source.includes('twitter')) {
      response = `@${need.contactInfo?.name} `;
      response += `Found a great match for your ${need.keywords.join('/')} needs! `;
      response += `Check out ${service.name}: ${affiliateLink}\n`;
      response += `${disclosure}`;
    } else {
      response = `Hello!\n\n`;
      response += `Regarding your request for ${need.keywords.join(', ')}, `;

      if (matchAnalysis && matchAnalysis.score > 0.8) {
        response += `I've identified a highly qualified freelancer who matches your needs. `;
        response += `They have exceptional ratings in ${matchAnalysis.reasons.slice(0, 2).join(' and ')}. `;
      }

      response += `I'd recommend ${service.name}. ${service.description}\n\n`;
      response += `You can get started here: ${affiliateLink}\n\n`;
      response += disclosure;
    }

    return response;
  }
}
