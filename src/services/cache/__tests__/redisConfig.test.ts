import { RedisConfig } from '../redisConfig';
import Redis from 'ioredis';
import { logger } from '../../../utils/logger';

jest.mock('ioredis');
jest.mock('../../../utils/logger');

interface MockRedis {
  ping: jest.Mock;
  on: jest.Mock;
  quit: jest.Mock;
}

describe('RedisConfig', () => {
  const mockConnectionString = 'redis://localhost:6379';

  beforeEach(() => {
    process.env.REDIS_CONNECTION_STRING = mockConnectionString;
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await RedisConfig.disconnect();
    delete process.env.REDIS_CONNECTION_STRING;
  });

  it('should initialize Redis connection successfully', async () => {
    const mockPing = jest.fn().mockResolvedValue('PONG');
    const mockOn = jest.fn();

    (Redis as unknown as jest.Mock).mockImplementation(
      () =>
        ({
          ping: mockPing,
          on: mockOn,
          quit: jest.fn().mockResolvedValue(undefined),
        }) as MockRedis
    );

    await RedisConfig.initialize();

    expect(Redis).toHaveBeenCalledWith(mockConnectionString, expect.any(Object));
    expect(mockPing).toHaveBeenCalled();
    expect(mockOn).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockOn).toHaveBeenCalledWith('error', expect.any(Function));
  });

  it('should throw error when REDIS_CONNECTION_STRING is not set', async () => {
    delete process.env.REDIS_CONNECTION_STRING;

    await expect(RedisConfig.initialize()).rejects.toThrow(
      'REDIS_CONNECTION_STRING environment variable is required'
    );
  });

  it('should handle Redis connection error', async () => {
    const mockError = new Error('Connection failed');
    const mockPing = jest.fn().mockRejectedValue(mockError);

    (Redis as unknown as jest.Mock).mockImplementation(
      () =>
        ({
          ping: mockPing,
          on: jest.fn(),
          quit: jest.fn().mockResolvedValue(undefined),
        }) as MockRedis
    );

    await expect(RedisConfig.initialize()).rejects.toThrow(mockError);
    expect(logger.error).toHaveBeenCalledWith('Failed to initialize Redis:', mockError);
  });

  it('should not reinitialize if already initialized', async () => {
    const mockPing = jest.fn().mockResolvedValue('PONG');

    (Redis as unknown as jest.Mock).mockImplementation(
      () =>
        ({
          ping: mockPing,
          on: jest.fn(),
          quit: jest.fn().mockResolvedValue(undefined),
        }) as MockRedis
    );

    await RedisConfig.initialize();
    await RedisConfig.initialize();

    expect(Redis).toHaveBeenCalledTimes(1);
    expect(mockPing).toHaveBeenCalledTimes(1);
  });

  it('should throw error when getting instance before initialization', () => {
    expect(() => RedisConfig.getInstance()).toThrow(
      'Redis not initialized. Call initialize() first.'
    );
  });

  it('should disconnect Redis connection', async () => {
    const mockQuit = jest.fn().mockResolvedValue(undefined);

    (Redis as unknown as jest.Mock).mockImplementation(
      () =>
        ({
          ping: jest.fn().mockResolvedValue('PONG'),
          on: jest.fn(),
          quit: mockQuit,
        }) as MockRedis
    );

    await RedisConfig.initialize();
    await RedisConfig.disconnect();

    expect(mockQuit).toHaveBeenCalled();
  });
});
