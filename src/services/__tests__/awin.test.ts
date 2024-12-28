import { AwinService } from '../awinService';
import { configService } from '../../config/configService';

jest.mock('../../config/configService');

describe('AwinService', () => {
  let awinService: AwinService;

  beforeEach(() => {
    jest.clearAllMocks();
    (configService.getAwinApiKey as jest.Mock).mockReturnValue('test-api-key');
    (configService.getAwinApiSecret as jest.Mock).mockReturnValue('test-api-secret');
    awinService = new AwinService();
  });

  it('should be defined', () => {
    expect(awinService).toBeDefined();
  });

  // Add more tests as needed
});
