import { GPTService } from '../services/gptService';
import { config } from 'dotenv';

// Load environment variables
config();

async function testOpenAIConnection(): Promise<void> {
  try {
    const gptService = GPTService.getInstance();
    
    console.log('Testing OpenAI connection...');
    
    const result = await gptService.analyzeMarketOpportunity('test product');
    console.log('Connection successful!');
    console.log('Test result:', result);
    
  } catch (error) {
    console.error('Error testing OpenAI connection:', error);
  }
}

// Run the test
testOpenAIConnection();
