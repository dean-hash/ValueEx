import { AwinService } from '../awinService';
import { configService } from '../../config/configService';
jest.mock('../../config/configService');
describe('AwinService', () => {
    let awinService;
    beforeEach(() => {
        jest.clearAllMocks();
        configService.getAwinApiKey.mockReturnValue('test-api-key');
        configService.getAwinApiSecret.mockReturnValue('test-api-secret');
        awinService = new AwinService();
    });
    it('should be defined', () => {
        expect(awinService).toBeDefined();
    });
    // Add more tests as needed
});
//# sourceMappingURL=awin.test.js.map