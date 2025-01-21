import { TurnContext } from 'botbuilder';
import { MetricsCollector } from '../../services/monitoring/Metrics';
import { jest } from '@jest/globals';
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

export const teamsTestConfig = {
    clientId: process.env.TEAMS_CLIENT_ID || 'test-client-id',
    clientSecret: process.env.TEAMS_CLIENT_SECRET || 'test-client-secret',
    tenantId: process.env.TEAMS_TENANT_ID || 'test-tenant-id',
    testUser: process.env.TEAMS_TEST_USER || 'test@example.com',
    testChannel: process.env.TEAMS_TEST_CHANNEL || 'test-channel',
    testTeam: process.env.TEAMS_TEST_TEAM || 'test-team',
    mockMode: process.env.TEAMS_MOCK_MODE === 'true' || true,
    timeouts: {
        api: 5000,
        auth: 10000,
        operation: 15000
    },
    retryConfig: {
        maxAttempts: 3,
        initialDelay: 1000,
        maxDelay: 5000
    }
};

export const setupTeamsTestEnv = () => {
    // Set up test environment variables
    process.env.TEAMS_TENANT_ID = 'test-tenant-id';
    process.env.TEAMS_CLIENT_ID = 'test-client-id';
    process.env.TEAMS_CLIENT_SECRET = 'test-client-secret';
    process.env.TEAMS_BOT_ID = 'test-bot-id';
    process.env.TEAMS_BOT_PASSWORD = 'test-bot-password';

    // Mock Graph API endpoints
    jest.mock('@microsoft/microsoft-graph-client', () => ({
        Client: {
            initWithMiddleware: jest.fn().mockReturnValue({
                api: jest.fn().mockReturnValue({
                    get: jest.fn().mockResolvedValue({}),
                    post: jest.fn().mockResolvedValue({}),
                    filter: jest.fn().mockReturnThis(),
                    header: jest.fn().mockReturnThis()
                })
            })
        }
    }));

    // Mock Bot Framework
    jest.mock('botbuilder', () => {
        const actualModule = jest.requireActual('botbuilder');
        return {
            ...actualModule,
            BotFrameworkAdapter: jest.fn().mockImplementation(() => ({
                processActivity: jest.fn().mockResolvedValue({}),
                continueConversation: jest.fn().mockImplementation((ref, logic) => 
                    Promise.resolve(logic({
                        sendActivity: jest.fn().mockResolvedValue({}),
                        updateActivity: jest.fn().mockResolvedValue({}),
                        deleteActivity: jest.fn().mockResolvedValue({}),
                        activity: {
                            type: 'message',
                            text: ''
                        }
                    } as unknown as TurnContext))
                )
            }))
        };
    });

    // Mock Azure Identity
    jest.mock('@azure/identity', () => ({
        ClientSecretCredential: jest.fn().mockImplementation(() => ({
            getToken: jest.fn().mockResolvedValue({ token: 'mock-token' })
        }))
    }));

    // Mock Logger
    jest.mock('../../services/logging/Logger', () => ({
        Logger: jest.fn().mockImplementation((serviceName: string) => ({
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn()
        }))
    }));

    // Mock MetricsCollector
    const mockMetricsCollector = {
        trackApiMetrics: jest.fn(),
        trackError: jest.fn(),
        getApiMetrics: jest.fn().mockReturnValue({
            requests: 0,
            errors: 0,
            latency: 0
        }),
        getResourceMetrics: jest.fn().mockReturnValue({
            cpu: 0,
            memory: 0,
            disk: 0,
            network: {
                latency: 0,
                bandwidth: 0
            }
        })
    };

    jest.mock('../../services/monitoring/Metrics', () => ({
        MetricsCollector: {
            getInstance: jest.fn().mockReturnValue(mockMetricsCollector)
        }
    }));
};
