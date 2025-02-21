import { ConfigService } from '../config/configService';
import { DomainAvailability } from '../types/domainTypes';
export declare class GoDaddyConnector {
    private readonly baseUrl;
    private readonly apiKey;
    private readonly apiSecret;
    constructor(config: ConfigService);
    private getHeaders;
    checkDomainAvailability(domainName: string): Promise<DomainAvailability>;
    purchaseDomain(domainName: string): Promise<boolean>;
    configureDNS(domainName: string, records: any[]): Promise<boolean>;
}
