import { GeminiService } from '../geminiService';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('GeminiService', () => {
  let service: GeminiService;

  beforeEach(() => {
    service = GeminiService.getInstance();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateContent', () => {
    it('should successfully generate content', async () => {
      const mockResponse = {
        data: {
          candidates: [{
            content: {
              parts: [{
                text: 'Generated content'
              }]
            }
          }]
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await service.generateContent('Test prompt');
      expect(result).toBe('Generated content');
    });

    it('should handle API errors', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('API Error'));

      await expect(service.generateContent('Test prompt')).rejects.toThrow('API Error');
    });
  });

  describe('analyzeMarketTrends', () => {
    it('should analyze market trends for a niche', async () => {
      const mockResponse = {
        data: {
          candidates: [{
            content: {
              parts: [{
                text: 'Market analysis result'
              }]
            }
          }]
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await service.analyzeMarketTrends('tech');
      expect(result).toBe('Market analysis result');
    });
  });

  describe('optimizeDomainValue', () => {
    it('should analyze domain value', async () => {
      const mockResponse = {
        data: {
          candidates: [{
            content: {
              parts: [{
                text: 'Domain value analysis'
              }]
            }
          }]
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await service.optimizeDomainValue('example.com');
      expect(result).toBe('Domain value analysis');
    });
  });

  describe('generateListingDescription', () => {
    it('should generate domain listing description', async () => {
      const mockResponse = {
        data: {
          candidates: [{
            content: {
              parts: [{
                text: 'Domain listing description'
              }]
            }
          }]
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await service.generateListingDescription('example.com', {
        marketSize: 1000000,
        growth: 15
      });
      expect(result).toBe('Domain listing description');
    });
  });
});
