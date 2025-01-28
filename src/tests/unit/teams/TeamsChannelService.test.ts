import { describe, expect, beforeEach, afterEach, it, jest } from '@jest/globals';
import { TeamsChannelService } from '../../../services/teams/TeamsChannelService';
import { Client } from '@microsoft/microsoft-graph-client';
import { TeamsAuthService } from '../../../services/teams/TeamsAuthService';
import { HealthStatus } from '../../../types/health';

// Mock dependencies
jest.mock('../../../services/teams/TeamsAuthService');
jest.mock('@microsoft/microsoft-graph-client');
jest.mock('@microsoft/teams-js');

describe('TeamsChannelService', () => {
  let channelService: TeamsChannelService;
  let mockClient: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock client
    mockClient = {
      api: jest.fn().mockReturnThis(),
      post: jest.fn(),
      get: jest.fn(),
    };

    // Mock the auth service to return our mock client
    (TeamsAuthService.prototype as any).getGraphClient = jest.fn().mockReturnValue(mockClient);

    // Create instance of service
    channelService = new TeamsChannelService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('should send message successfully', async () => {
      // Mock successful API call
      mockClient.post.mockResolvedValueOnce({});

      const result = await channelService.sendMessage('channel-id', 'test message');

      expect(result).toBe(true);
      expect(mockClient.api).toHaveBeenCalledWith('/chats/channel-id/messages');
      expect(mockClient.post).toHaveBeenCalledWith({
        body: {
          contentType: 'text',
          content: 'test message',
        },
      });
    });

    it('should handle send message errors gracefully', async () => {
      // Mock API error
      mockClient.post.mockRejectedValueOnce(new Error('API Error'));

      const result = await channelService.sendMessage('channel-id', 'test message');

      expect(result).toBe(false);
      expect(mockClient.api).toHaveBeenCalledWith('/chats/channel-id/messages');
    });
  });

  describe('addMember', () => {
    it('should add member successfully', async () => {
      // Mock successful API call
      mockClient.post.mockResolvedValueOnce({});

      const result = await channelService.addMember('channel-id', 'user@example.com');

      expect(result).toBe(true);
      expect(mockClient.api).toHaveBeenCalledWith('/chats/channel-id/members');
      expect(mockClient.post).toHaveBeenCalledWith({
        '@odata.type': '#microsoft.graph.aadUserConversationMember',
        roles: ['owner'],
        'user@odata.bind': 'https://graph.microsoft.com/v1.0/users/user@example.com',
      });
    });

    it('should handle add member errors gracefully', async () => {
      // Mock API error
      mockClient.post.mockRejectedValueOnce(new Error('API Error'));

      const result = await channelService.addMember('channel-id', 'user@example.com');

      expect(result).toBe(false);
      expect(mockClient.api).toHaveBeenCalledWith('/chats/channel-id/members');
    });
  });

  describe('sendHealthAlert', () => {
    it('should send health alerts correctly', async () => {
      const alert: HealthStatus = {
        service: 'TestService',
        status: 'healthy',
        message: 'All systems operational',
      };

      const result = await channelService.sendHealthAlert(alert);
      expect(result).toBeTruthy();
    });

    it('should handle errors gracefully', async () => {
      const alert: HealthStatus = {
        service: 'TestService',
        status: 'down',
        message: 'Service unavailable',
      };

      // Mock Teams API failure
      jest
        .spyOn(channelService as any, 'sendMessage')
        .mockRejectedValue(new Error('Teams API Error'));

      await expect(channelService.sendHealthAlert(alert)).rejects.toThrow('Teams API Error');
    });
  });
});
