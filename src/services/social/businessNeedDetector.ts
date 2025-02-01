import { BusinessNeed, SocialPost, JobPosting } from '../../types/affiliate';

export class BusinessNeedDetector {
  private readonly triggerPhrases = [
    'can you recommend',
    'looking for',
    'need help with',
    'seeking',
    'want to hire',
    'anyone know',
    'suggestions for',
  ];

  private readonly serviceKeywords = [
    'developer',
    'designer',
    'writer',
    'logo',
    'website',
    'app',
    'marketing',
    'video',
    'translation',
    'virtual assistant',
  ];

  async detectNeedsFromSocialPost(post: SocialPost): Promise<BusinessNeed | null> {
    // Check if post contains trigger phrases
    const hasTrigger = this.triggerPhrases.some((phrase) =>
      post.content.toLowerCase().includes(phrase.toLowerCase())
    );

    if (!hasTrigger) return null;

    // Extract relevant keywords
    const keywords = this.serviceKeywords.filter((keyword) =>
      post.content.toLowerCase().includes(keyword.toLowerCase())
    );

    if (keywords.length === 0) return null;

    const contactInfo: BusinessNeed['contactInfo'] = {};
    if (post.author.name) contactInfo.name = post.author.name;
    if (post.platform) contactInfo.platform = post.platform;
    if (post.author.profileUrl) contactInfo.profileUrl = post.author.profileUrl;

    return {
      id: `social_${post.platform}_${post.id}`,
      source: post.platform,
      description: post.content,
      keywords,
      timestamp: post.timestamp,
      contactInfo,
    };
  }

  async detectNeedsFromJobPosting(posting: JobPosting): Promise<BusinessNeed | null> {
    // Extract relevant keywords from title and description
    const keywords = this.serviceKeywords.filter(
      (keyword) =>
        posting.title.toLowerCase().includes(keyword.toLowerCase()) ||
        posting.description.toLowerCase().includes(keyword.toLowerCase())
    );

    if (keywords.length === 0) return null;

    const contactInfo: BusinessNeed['contactInfo'] = {};
    if (posting.contactInfo?.name) contactInfo.name = posting.contactInfo.name;
    if (posting.platform) contactInfo.platform = posting.platform;

    return {
      id: `job_${posting.platform}_${posting.id}`,
      source: posting.platform,
      description: `${posting.title}\n${posting.description}`,
      keywords,
      timestamp: posting.postedAt,
      contactInfo,
    };
  }

  async analyzeSentiment(text: string): Promise<number> {
    // Basic sentiment analysis
    const positiveWords = ['need', 'want', 'looking', 'hire', 'help', 'urgent', 'asap'];
    const negativeWords = ['spam', 'scam', 'fake', 'avoid'];

    const words = text.toLowerCase().split(/\s+/);
    let score = 0;

    words.forEach((word) => {
      if (positiveWords.includes(word)) score += 0.2;
      if (negativeWords.includes(word)) score -= 0.3;
    });

    return Math.max(-1, Math.min(1, score)); // Normalize to -1 to 1
  }
}
