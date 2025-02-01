import { OpportunityManager } from '../src/services/affiliate/opportunityManager';
import { logger } from '../src/utils/logger';

async function testOpportunityManager() {
  const manager = new OpportunityManager();

  // Test with a sample social post
  const socialPost = {
    id: 'test123',
    platform: 'linkedin',
    content:
      'Looking for a skilled developer to help build a new website for our growing business. Need someone experienced with React and Node.js. Any recommendations?',
    author: {
      name: 'John Smith',
      profileUrl: 'https://linkedin.com/in/johnsmith',
    },
    timestamp: new Date().toISOString(),
  };

  // Test with a sample job posting
  const jobPosting = {
    id: 'job456',
    platform: 'indeed',
    title: 'Seeking Logo Designer for Tech Startup',
    description:
      'Need a professional designer to create a modern, tech-focused logo for our AI startup. Experience with tech branding preferred.',
    company: 'TechCo Inc',
    contactInfo: {
      name: 'Sarah Johnson',
      email: 'sarah@techco.com',
    },
    postedAt: new Date().toISOString(),
  };

  try {
    logger.info('Testing social post processing...');
    const socialResult = await manager.processSocialPost(socialPost);
    if (socialResult) {
      logger.info('Social post processed successfully', {
        service: socialResult.service.name,
        sentiment: socialResult.sentiment,
      });

      const response = await manager.generateResponse(socialResult);
      logger.info('Generated response:', { response });
    }

    logger.info('Testing job posting processing...');
    const jobResult = await manager.processJobPosting(jobPosting);
    if (jobResult) {
      logger.info('Job posting processed successfully', {
        service: jobResult.service.name,
        sentiment: jobResult.sentiment,
      });

      const response = await manager.generateResponse(jobResult);
      logger.info('Generated response:', { response });
    }

    logger.info('✅ Opportunity manager tests completed successfully');
  } catch (error) {
    logger.error('❌ Opportunity manager test failed:', { error });
    throw error;
  }
}

testOpportunityManager().catch(console.error);
