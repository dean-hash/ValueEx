import { ConfigService } from '../config/configService';
import { GoDaddyConnector } from '../connectors/godaddy';
import { UnifiedIntelligenceField } from './unifiedIntelligence';
import { ResonanceVisualizer } from '../visualization/resonanceVisualizer';
import { DomainInfo, DomainAvailability } from '../types/domainTypes';
export declare class DomainEcosystem {
    private readonly config;
    private readonly godaddy;
    private readonly intelligence;
    private readonly visualizer;
    constructor(config: ConfigService, godaddy: GoDaddyConnector, intelligence: UnifiedIntelligenceField, visualizer: ResonanceVisualizer);
    analyzeDomain(domainName: string): Promise<DomainInfo>;
    checkDomainAvailability(domainName: string): Promise<DomainAvailability>;
    purchaseDomain(domainName: string): Promise<boolean>;
}
