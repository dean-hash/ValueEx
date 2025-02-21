import { ConfigService } from '../config/configService';
import { GoDaddyConnector } from '../connectors/godaddy';
import { UnifiedIntelligenceField } from './unifiedIntelligence';
import { ResonanceVisualizer } from '../visualization/resonanceVisualizer';
import { DomainInfo, DomainAvailability, FieldState } from '../types/domainTypes';

export class DomainEcosystem {
  private readonly config: ConfigService;
  private readonly godaddy: GoDaddyConnector;
  private readonly intelligence: UnifiedIntelligenceField;
  private readonly visualizer: ResonanceVisualizer;

  constructor(
    config: ConfigService,
    godaddy: GoDaddyConnector,
    intelligence: UnifiedIntelligenceField,
    visualizer: ResonanceVisualizer
  ) {
    this.config = config;
    this.godaddy = godaddy;
    this.intelligence = intelligence;
    this.visualizer = visualizer;
  }

  public async analyzeDomain(domainName: string): Promise<DomainInfo> {
    try {
      const domainInfo = await this.intelligence.analyzeDomain(domainName);
      const state = await this.intelligence.getDomainState();
      await this.intelligence.updateDomainState({
        ...state,
        domains: state.domains.map((d) => (d.name === domainName ? domainInfo : d)),
      } as FieldState);
      return domainInfo;
    } catch (error) {
      throw new Error(`Failed to analyze domain: ${(error as Error).message}`);
    }
  }

  public async checkDomainAvailability(domainName: string): Promise<DomainAvailability> {
    try {
      return await this.godaddy.checkDomainAvailability(domainName);
    } catch (error) {
      throw new Error(`Failed to check domain availability: ${(error as Error).message}`);
    }
  }

  public async purchaseDomain(domainName: string): Promise<boolean> {
    try {
      const availability = await this.checkDomainAvailability(domainName);
      if (!availability.available) {
        throw new Error('Domain is not available');
      }

      const success = await this.godaddy.purchaseDomain(domainName);
      if (success) {
        const state = await this.intelligence.getDomainState();
        const newDomain: DomainInfo = {
          name: domainName,
          status: 'pending',
          resonance: 0,
          metrics: {
            stability: 0,
            coherence: 0,
          },
        };

        await this.intelligence.updateDomainState({
          ...state,
          domains: [...state.domains, newDomain],
        } as FieldState);
      }
      return success;
    } catch (error) {
      throw new Error(`Failed to purchase domain: ${(error as Error).message}`);
    }
  }
}
