import { jest } from '@jest/globals';
import { MetricsCollector } from '../../../services/monitoring/Metrics';
import { TeamsChannelService } from '../../../services/teams/TeamsChannelService';

// Mock MetricsCollector
const mockMetricsCollector = {
    trackApiMetrics: jest.fn(),
    trackError: jest.fn(),
    getApiMetrics: jest.fn().mockReturnValue({
        requests: 0,
        errors: 0,
        latency: 0
    })
};

jest.mock('../../../services/monitoring/Metrics', () => ({
    MetricsCollector: {
        getInstance: jest.fn().mockReturnValue(mockMetricsCollector)
    }
}));

// Mock TeamsChannelService
jest.mock('../../../services/teams/TeamsChannelService', () => ({
    TeamsChannelService: jest.fn().mockImplementation(() => ({
        sendMessage: jest.fn().mockResolvedValue(true)
    }))
}));

// Mock worker_threads
jest.mock('worker_threads', () => ({
    Worker: jest.fn().mockImplementation(() => ({
        on: jest.fn(),
        postMessage: jest.fn()
    })),
    isMainThread: true,
    parentPort: {
        on: jest.fn(),
        postMessage: jest.fn()
    }
}));
