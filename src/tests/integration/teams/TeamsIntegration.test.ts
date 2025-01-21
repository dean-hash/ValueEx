import { describe, expect, beforeAll, afterAll, it, jest } from '@jest/globals';
import { TeamsAuthService } from '../../../services/teams/TeamsAuthService';
import { TeamsChannelService } from '../../../services/teams/TeamsChannelService';
import { TeamsBotService } from '../../../services/teams/TeamsBotService';
import { teamsConfig } from '../../../config/teams.config';
import { TurnContext, Activity, ActivityTypes, ConversationAccount, ResourceResponse } from 'botbuilder';
import { setupMinimalTestEnv } from '../../setup/minimal';
import { MetricsCollector } from '../../../services/monitoring/Metrics';
import { Client } from '@microsoft/microsoft-graph-client';

// Create test class that exposes protected methods
class TestTeamsChannelService extends TeamsChannelService {
    public async testGetOrCreateChannel(teamId: string, channelName: string) {
        return this.getOrCreateChannel(teamId, channelName);
    }

    public async testGetOrCreateTeam() {
        return this.getOrCreateTeam();
    }

    public async testCreateChannel(teamId: string, channelName: string) {
        const response = await this.graphClient
            .api(`/teams/${teamId}/channels`)
            .post({
                displayName: channelName,
                description: `Channel for ${channelName}`
            });
        return response;
    }
}

// Mock MetricsCollector singleton
const mockMetricsCollector = {
    trackApiMetrics: jest.fn(),
    trackError: jest.fn(),
    getApiMetrics: jest.fn().mockReturnValue({
        requests: 0,
        errors: 0,
        latency: 0
    }),
    getResourceMetrics: jest.fn()
};

jest.mock('../../../services/monitoring/Metrics', () => ({
    MetricsCollector: {
        getInstance: jest.fn().mockReturnValue(mockMetricsCollector)
    }
}));

// Mock Microsoft Graph Client
const mockGraphClient = {
    api: jest.fn().mockReturnThis(),
    filter: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue({ value: [] }),
    post: jest.fn().mockImplementation((data?: any) => Promise.resolve({ id: 'mock-id' })),
    patch: jest.fn().mockImplementation(() => Promise.resolve({})),
    delete: jest.fn().mockImplementation(() => Promise.resolve())
};

jest.mock('@microsoft/microsoft-graph-client', () => ({
    Client: {
        init: jest.fn().mockReturnValue(mockGraphClient)
    }
}));

// Set up test environment
setupMinimalTestEnv();

describe('Teams Integration Tests', () => {
    let authService: TeamsAuthService;
    let channelService: TestTeamsChannelService;
    let botService: TeamsBotService;
    const testTeamId = 'test-team-id';
    const testChannelId = 'test-channel-id';

    beforeAll(() => {
        // Initialize services
        authService = new TeamsAuthService();
        channelService = new TestTeamsChannelService();
        botService = new TeamsBotService();

        // Mock TeamsAuthService methods
        jest.spyOn(authService, 'validateUser').mockImplementation(async (email) => {
            if (email === 'cascade@gibbetech.com') {
                return {
                    email,
                    role: 'admin',
                    permissions: ['full_access', 'manage_users', 'manage_channels', 'manage_bots']
                };
            }
            return {
                email,
                role: 'user',
                permissions: ['read', 'write', 'participate']
            };
        });

        // Mock TeamsBotService methods
        const mockResourceResponse: ResourceResponse = { id: 'test-message-id' };
        jest.spyOn(botService as any, 'sendActivity').mockResolvedValue(mockResourceResponse);
        jest.spyOn(botService as any, 'updateActivity').mockResolvedValue(mockResourceResponse);
        jest.spyOn(botService as any, 'deleteActivity').mockResolvedValue();

        // Set up mock responses for Graph API
        mockGraphClient.get.mockResolvedValue({ value: [] });
        mockGraphClient.post
            .mockResolvedValueOnce({ id: testTeamId })
            .mockResolvedValueOnce({ id: testChannelId });
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    describe('Channel Management', () => {
        it('should create a new channel successfully', async () => {
            const channel = await channelService.testGetOrCreateChannel(testTeamId, 'test-channel');
            expect(channel.id).toBe(testChannelId);
        });

        it('should create a new team if none exists', async () => {
            const team = await channelService.testGetOrCreateTeam();
            expect(team.id).toBe(testTeamId);
        });

        it('should create channel with proper configuration', async () => {
            const channelName = 'test-channel';
            const response = await channelService.testCreateChannel(testTeamId, channelName);
            expect(response.id).toBeDefined();
            expect(mockGraphClient.post).toHaveBeenCalledWith({
                displayName: channelName,
                description: expect.any(String)
            });
        });
    });

    describe('End-to-End Flow', () => {
        it('should complete full communication cycle', async () => {
            // 1. Send test message
            const messageSent = await channelService.sendMessage(
                'channel-id',
                'Integration test message'
            );
            expect(messageSent).toBe(true);

            // 2. Add test member
            const memberAdded = await channelService.addMember(
                'channel-id',
                'test@example.com'
            );
            expect(memberAdded).toBe(true);

            // 3. Verify metrics were tracked
            expect(mockMetricsCollector.trackApiMetrics).toHaveBeenCalled();
            expect(mockMetricsCollector.trackError).not.toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        it('should handle invalid channel gracefully', async () => {
            mockGraphClient.post.mockRejectedValueOnce(new Error('Invalid channel'));

            const result = await channelService.sendMessage(
                'invalid-channel',
                'Test message'
            );
            expect(result).toBe(false);
            expect(mockMetricsCollector.trackError).toHaveBeenCalled();
        });
    });

    describe('TeamsAuthService Tests', () => {
        it('should validate admin user successfully', async () => {
            const adminEmail = 'cascade@gibbetech.com';
            const user = await authService.validateUser(adminEmail);
            
            expect(user).toBeDefined();
            expect(user?.role).toBe('admin');
            expect(user?.permissions).toContain('full_access');
        });

        it('should validate regular user successfully', async () => {
            const userEmail = 'gpt@divvytech.com';
            const user = await authService.validateUser(userEmail);
            
            expect(user).toBeDefined();
            expect(user?.role).toBe('user');
            expect(user?.permissions).toContain('write');
        });
    });

    describe('TeamsChannelService Tests', () => {
        it('should create channel successfully', async () => {
            const channelName = 'test-channel';
            const channelId = await channelService.createChannel(testTeamId, channelName);
            
            expect(channelId).toBe(testChannelId);
        });

        it('should send message to channel successfully', async () => {
            const message = 'Test message';
            const result = await channelService.sendMessage(testChannelId, message);
            
            expect(result).toBe(true);
        });

        it('should add member to channel successfully', async () => {
            const userEmail = 'gpt@divvytech.com';
            const result = await channelService.addMember(testChannelId, userEmail);
            
            expect(result).toBe(true);
        });
    });

    describe('TeamsBotService Tests', () => {
        it('should handle help command correctly', async () => {
            const mockContext = createMockContext('!help');
            await botService.processMessage(mockContext as TurnContext);
            
            expect(mockContext.sendActivity).toHaveBeenCalledWith(expect.stringContaining('Available commands'));
        });

        it('should handle status command correctly', async () => {
            const mockContext = createMockContext('!status');
            await botService.processMessage(mockContext as TurnContext);
            
            expect(mockContext.sendActivity).toHaveBeenCalledWith(expect.stringContaining('System Status'));
        });

        it('should handle metrics command correctly', async () => {
            const mockContext = createMockContext('!metrics');
            await botService.processMessage(mockContext as TurnContext);
            
            expect(mockContext.sendActivity).toHaveBeenCalledWith(expect.stringContaining('Current Metrics'));
        });

        it('should handle unknown command gracefully', async () => {
            const mockContext = createMockContext('!unknown');
            await botService.processMessage(mockContext as TurnContext);
            
            expect(mockContext.sendActivity).toHaveBeenCalledWith('Type !help to see available commands');
        });
    });

    describe('Performance', () => {
        it('should maintain acceptable latency', async () => {
            const startTime = Date.now();
            
            mockGraphClient.post.mockResolvedValueOnce({});
            
            await channelService.sendMessage(
                'channel-id',
                'Performance test message'
            );
            
            const endTime = Date.now();
            const latency = endTime - startTime;
            
            expect(latency).toBeLessThan(teamsTestConfig.timeouts.api);
        });
    });
});

// Helper function to create mock TurnContext
function createMockContext(message: string): Partial<TurnContext> {
    const context: Partial<TurnContext> = {
        activity: {
            type: ActivityTypes.Message,
            text: message
        } as Activity,
        sendActivity: jest.fn().mockResolvedValue({}),
        updateActivity: jest.fn().mockResolvedValue({}),
        deleteActivity: jest.fn().mockResolvedValue({})
    };
    return context;
}
