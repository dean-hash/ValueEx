import { logger } from '../../utils/logger';
import { BusinessNeed } from '../../types/affiliate';

interface FreelancerProfile {
  id: string;
  username: string;
  level: 'new' | 'level_1' | 'level_2' | 'top_rated' | 'pro';
  description: string;
  skills: string[];
  languages: string[];
  rating: number;
  totalReviews: number;
  completedProjects: number;
  responseTime: number; // in hours
  portfolio: {
    title: string;
    description: string;
    tags: string[];
  }[];
  reviews: {
    rating: number;
    comment: string;
    projectType: string;
    date: string;
  }[];
}

interface MatchScore {
  score: number;
  reasons: string[];
  confidenceLevel: number;
}

export class FreelancerMatcher {
  private async analyzeProjectRequirements(need: BusinessNeed): Promise<{
    requiredSkills: string[];
    preferredSkills: string[];
    complexity: 'low' | 'medium' | 'high';
    urgency: 'low' | 'medium' | 'high';
    budget: 'low' | 'medium' | 'high';
  }> {
    // Extract key information from the need description
    const text = need.description.toLowerCase();

    // Detect urgency
    const urgencyKeywords = {
      high: ['urgent', 'asap', 'immediately', 'rush'],
      medium: ['soon', 'next week', 'within'],
      low: ['flexible', 'no rush', 'when possible'],
    };

    // Detect complexity
    const complexityIndicators = {
      high: ['complex', 'advanced', 'custom', 'enterprise'],
      medium: ['professional', 'business', 'standard'],
      low: ['simple', 'basic', 'quick'],
    };

    // Implementation details would go here
    // For MVP, return placeholder analysis
    return {
      requiredSkills: need.keywords,
      preferredSkills: [],
      complexity: 'medium',
      urgency: 'medium',
      budget: 'medium',
    };
  }

  private async analyzeFreelancerProfile(profile: FreelancerProfile): Promise<{
    expertise: string[];
    reliability: number;
    qualityScore: number;
    communicationScore: number;
    specializations: string[];
  }> {
    // Analyze review sentiment and patterns
    const reviewAnalysis = profile.reviews.reduce(
      (acc, review) => {
        acc.avgRating += review.rating;
        // Analyze review comments for key indicators
        const comment = review.comment.toLowerCase();
        if (comment.includes('communication')) acc.communicationMentions++;
        if (comment.includes('quality')) acc.qualityMentions++;
        if (comment.includes('time')) acc.timelineMentions++;
        return acc;
      },
      { avgRating: 0, communicationMentions: 0, qualityMentions: 0, timelineMentions: 0 }
    );

    // Extract expertise from portfolio
    const expertise = new Set<string>();
    profile.portfolio.forEach((item) => {
      item.tags.forEach((tag) => expertise.add(tag.toLowerCase()));
    });

    return {
      expertise: [...expertise],
      reliability:
        (profile.completedProjects / (profile.totalReviews || 1)) *
        (reviewAnalysis.avgRating / profile.reviews.length),
      qualityScore: reviewAnalysis.qualityMentions / profile.reviews.length,
      communicationScore: reviewAnalysis.communicationMentions / profile.reviews.length,
      specializations: profile.skills,
    };
  }

  async matchFreelancerToNeed(need: BusinessNeed, profile: FreelancerProfile): Promise<MatchScore> {
    try {
      const requirements = await this.analyzeProjectRequirements(need);
      const freelancerAnalysis = await this.analyzeFreelancerProfile(profile);

      let score = 0;
      const reasons: string[] = [];

      // Skills match
      const skillMatchCount = requirements.requiredSkills.filter((skill) =>
        freelancerAnalysis.expertise.includes(skill.toLowerCase())
      ).length;
      const skillScore = skillMatchCount / requirements.requiredSkills.length;
      score += skillScore * 0.4;
      reasons.push(`Skill match: ${Math.round(skillScore * 100)}%`);

      // Experience level appropriateness
      const experienceScore =
        profile.level === 'pro'
          ? 1
          : profile.level === 'top_rated'
            ? 0.8
            : profile.level === 'level_2'
              ? 0.6
              : profile.level === 'level_1'
                ? 0.4
                : 0.2;
      score += experienceScore * 0.2;
      reasons.push(`Experience level: ${profile.level}`);

      // Reliability and quality
      const reliabilityScore = freelancerAnalysis.reliability;
      score += reliabilityScore * 0.2;
      reasons.push(`Reliability score: ${Math.round(reliabilityScore * 100)}%`);

      // Communication
      const communicationScore = freelancerAnalysis.communicationScore;
      score += communicationScore * 0.2;
      reasons.push(`Communication score: ${Math.round(communicationScore * 100)}%`);

      // Calculate confidence level based on amount of data
      const confidenceLevel = Math.min(
        1,
        (profile.reviews.length / 50) * // Number of reviews
          (profile.portfolio.length / 10) * // Portfolio size
          (profile.completedProjects / 100) // Completed projects
      );

      logger.info('Freelancer match analysis', {
        needId: need.id,
        freelancerId: profile.id,
        score,
        confidenceLevel,
        reasons,
      });

      return {
        score,
        reasons,
        confidenceLevel,
      };
    } catch (error) {
      logger.error('Error matching freelancer to need', {
        error,
        needId: need.id,
        freelancerId: profile.id,
      });
      throw error;
    }
  }
}
