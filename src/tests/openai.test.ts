import { OpenAIClient } from '../clients/openai';
import OpenAI from 'openai';
import { configService } from '../config/configService';

// Mock OpenAI
const mockCreate = jest.fn().mockResolvedValue({
  choices: [
    {
      message: {
        content: '{"test": "response"}',
      },
    },
  ],
});

jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    })),
    APIError: jest.fn().mockImplementation((status, error) => ({
      status,
      ...error,
    })),
  };
});

// Mock ConfigService
jest.mock('../config/configService', () => ({
  configService: {
    getOpenAIKey: jest.fn().mockReturnValue('test-key'),
  },
}));

describe('OpenAIClient', () => {
  let MockOpenAI: jest.Mock;

  beforeEach(() => {
    // Get fresh reference to the mock
    MockOpenAI = jest.requireMock('openai').default;
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should throw error if API key is empty', () => {
      // Mock empty API key
      (configService.getOpenAIKey as jest.Mock).mockReturnValueOnce('');

      expect(() => {
        OpenAIClient.getInstance();
      }).toThrow('OpenAI API key is required');
    });

    it('should create instance with valid API key', () => {
      const client = OpenAIClient.getInstance();
      expect(client).toBeDefined();
      expect(MockOpenAI).toHaveBeenCalledWith({
        apiKey: 'test-key',
        maxRetries: 3,
        timeout: 30000,
      });
    });
  });

  describe('chat completion', () => {
    it('should create chat completion with default options', async () => {
      const client = OpenAIClient.getInstance();
      const messages = [{ role: 'user' as const, content: 'test' }];

      await client.createChatCompletion(messages);

      expect(mockCreate).toHaveBeenCalledWith({
        model: 'gpt-4-turbo-preview',
        messages,
        temperature: 0.7,
        stream: false,
      });
    });

    it('should handle custom options', async () => {
      const client = OpenAIClient.getInstance();
      const messages = [{ role: 'user' as const, content: 'test' }];
      const options = {
        model: 'gpt-3.5-turbo',
        temperature: 0.5,
        max_tokens: 100,
      };

      await client.createChatCompletion(messages, options);

      expect(mockCreate).toHaveBeenCalledWith({
        ...options,
        messages,
        stream: false,
      });
    });
  });

  describe('JSON completion', () => {
    it('should parse JSON response', async () => {
      const client = OpenAIClient.getInstance();
      const messages = [{ role: 'user' as const, content: 'test' }];

      const result = await client.createJSONCompletion(messages);

      expect(result).toEqual({ test: 'response' });
    });

    it('should handle JSON parsing errors', async () => {
      const client = OpenAIClient.getInstance();
      const messages = [{ role: 'user' as const, content: 'test' }];

      // Mock invalid JSON response
      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: 'invalid json',
            },
          },
        ],
      });

      const result = await client.createJSONCompletion(messages);
      expect(result).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should handle rate limit errors', async () => {
      const client = OpenAIClient.getInstance();
      const messages = [{ role: 'user' as const, content: 'test' }];

      // Mock rate limit error
      mockCreate.mockRejectedValueOnce({
        status: 429,
        message: 'Rate limit exceeded',
      });

      await expect(client.createChatCompletion(messages)).rejects.toThrow();
    });

    it('should handle authentication errors', async () => {
      const client = OpenAIClient.getInstance();
      const messages = [{ role: 'user' as const, content: 'test' }];

      // Mock auth error
      mockCreate.mockRejectedValueOnce({
        status: 401,
        message: 'Invalid API key',
      });

      await expect(client.createChatCompletion(messages)).rejects.toThrow();
    });
  });
});
