import { AwinService } from '../../services/awinService';
import { configService } from '../../config/configService';
import { ResonanceFieldService } from '../../services/resonanceField';
import { Logger } from '../../logger/logger';

describe('Awin Service Tests', () => {
  let awinService: AwinService;
  let resonanceField: ResonanceFieldService;
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger();
    resonanceField = new ResonanceFieldService(logger);
    awinService = new AwinService(configService, resonanceField, logger);
  });

  it('should initialize with correct configuration', () => {
    expect(awinService).toBeDefined();
  });

  // Note: Product search tests are currently blocked due to API limitations
  // See documentation in awinService.ts for details
  it('should handle product search gracefully when API is unavailable', async () => {
    const searchParams = {
      searchTerm: 'test product',
      limit: 10
    };

    await expect(awinService.searchProducts(searchParams))
      .resolves
      .toEqual([]); // Expecting empty array as fallback
  });

  it('should fetch merchant programs successfully', async () => {
    const programs = await awinService.getMerchantPrograms();
    expect(Array.isArray(programs)).toBe(true);
  });
});
