import { GPTService } from '../../src/services/gptService';
import OpenAI from 'openai';

// Mock OpenAI
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  }));
});

describe('GPTService', () => {
  let gptService: GPTService;

  beforeAll(() => {
    process.env.OPENAI_API_KEY = 'test-key';
    gptService = GPTService.getInstance();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeMarketOpportunity', () => {
    it('should analyze market opportunity successfully', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                opportunity: 85,
                confidence: 90,
                reasoning: 'Strong market demand',
              }),
            },
          },
        ],
      };

      (OpenAI as jest.Mock).mock.results[0].value.chat.completions.create.mockResolvedValueOnce(
        mockResponse
      );

      const result = await gptService.analyzeMarketOpportunity('test product');
      expect(result).toEqual({
        opportunity: 85,
        confidence: 90,
        reasoning: 'Strong market demand',
      });
    });
  });

  describe('generateProductDescription', () => {
    it('should generate product description successfully', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Generated product description',
            },
          },
        ],
      };

      (OpenAI as jest.Mock).mock.results[0].value.chat.completions.create.mockResolvedValueOnce(
        mockResponse
      );

      const result = await gptService.generateProductDescription(['keyword1', 'keyword2']);
      expect(result).toBe('Generated product description');
    });
  });

  describe('analyzePurchaseIntent', () => {
    it('should analyze purchase intent successfully', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                intent: 75,
                urgency: 60,
                interests: ['feature1', 'feature2'],
              }),
            },
          },
        ],
      };

      (OpenAI as jest.Mock).mock.results[0].value.chat.completions.create.mockResolvedValueOnce(
        mockResponse
      );

      const result = await gptService.analyzePurchaseIntent('user query');
      expect(result).toEqual({
        intent: 75,
        urgency: 60,
        interests: ['feature1', 'feature2'],
      });
    });
  });
});
