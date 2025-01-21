import { GPTService } from '../services/gptService';
import { config } from 'dotenv';
import { logger } from './logger';

// Load environment variables
config();

async function testOpenAIConnection(): Promise<void> {
  try {
    const gptService = GPTService.getInstance();

    logger.info('Testing OpenAI connection...');

    const result = await gptService.analyzeMarketOpportunity('test product');
    logger.info('Connection successful!');
    logger.info('Test result:', result);
  } catch (error) {
    logger.error('Error testing OpenAI connection:', error);
  }
}

// Run the test
testOpenAIConnection();
