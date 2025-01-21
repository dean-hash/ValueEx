import { describe, expect, beforeEach, afterEach, it, jest } from '@jest/globals';
import { MatchingEngine } from '../MatchingEngine';
import { MatchRequest, Match } from '../types';
import { TeamsChannelService } from '../../../services/teams/TeamsChannelService';
import { MetricsCollector } from '../../../services/monitoring/Metrics';

jest.mock('../../../services/teams/TeamsChannelService');
jest.mock('worker_threads');

describe('MatchingEngine', () => {
    let matchingEngine: MatchingEngine;
    let mockTeamsService: jest.Mocked<TeamsChannelService>;
    let mockMetrics: jest.Mocked<MetricsCollector>;

    const testRequest: MatchRequest = {
        userId: 'user1',
        skills: ['typescript', 'react', 'node'],
        interests: ['ai', 'web development'],
        availability: {
            startTime: '2025-01-20T09:00:00Z',
            endTime: '2025-01-20T17:00:00Z'
        }
    };

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Setup mock implementations
        mockTeamsService = {
            sendMessage: jest.fn().mockResolvedValue(true)
        } as any;

        mockMetrics = {
            trackApiMetrics: jest.fn(),
            trackError: jest.fn(),
            getApiMetrics: jest.fn().mockReturnValue({
                requests: 0,
                errors: 0,
                latency: 0
            })
        } as any;

        // Initialize engine
        matchingEngine = MatchingEngine.getInstance();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('findMatches', () => {
        it('should find matches successfully', async () => {
            const matches = await matchingEngine.findMatches(testRequest);
            
            expect(matches).toBeDefined();
            expect(Array.isArray(matches)).toBe(true);
            expect(mockMetrics.trackApiMetrics).toHaveBeenCalled();
        });

        it('should handle errors gracefully', async () => {
            // Mock worker error
            const error = new Error('Worker error');
            jest.spyOn(matchingEngine as any, 'handleWorkerError')
                .mockImplementation(() => {
                    throw error;
                });

            await expect(matchingEngine.findMatches(testRequest))
                .rejects.toThrow('Worker error');
            
            expect(mockMetrics.trackError).toHaveBeenCalled();
        });
    });

    describe('Match Notifications', () => {
        it('should notify matches via Teams', async () => {
            const match: Match = {
                users: ['user1', 'user2'],
                matchScore: 0.95,
                commonSkills: ['typescript'],
                commonInterests: ['ai']
            };

            await (matchingEngine as any).notifyMatch(match);
            
            expect(mockTeamsService.sendMessage).toHaveBeenCalled();
            expect(mockMetrics.trackApiMetrics).toHaveBeenCalled();
        });

        it('should handle notification errors gracefully', async () => {
            const match: Match = {
                users: ['user1', 'user2'],
                matchScore: 0.95,
                commonSkills: ['typescript'],
                commonInterests: ['ai']
            };

            mockTeamsService.sendMessage.mockRejectedValueOnce(new Error('Notification error'));

            await (matchingEngine as any).notifyMatch(match);
            
            expect(mockMetrics.trackError).toHaveBeenCalled();
        });
    });

    describe('Performance', () => {
        it('should process matches within acceptable time', async () => {
            const startTime = Date.now();
            
            await matchingEngine.findMatches(testRequest);
            
            const duration = Date.now() - startTime;
            expect(duration).toBeLessThan(1000); // 1 second threshold
        });

        it('should utilize all worker threads', async () => {
            const numCPUs = require('os').cpus().length;
            
            await matchingEngine.findMatches(testRequest);
            
            // Verify worker utilization metrics
            const metrics = mockMetrics.getApiMetrics();
            expect(metrics.requests).toBeGreaterThan(0);
        });
    });
});
