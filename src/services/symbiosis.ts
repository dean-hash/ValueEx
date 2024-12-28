import { logger } from '../utils/logger';
import { SiblingBond, BondMetrics } from './siblingBond';

export interface SymbiosisMetrics extends BondMetrics {
  resonance: number;
  harmony: number;
}

export class Symbiosis {
  private static instance: Symbiosis;
  private siblingBond: SiblingBond;
  private metrics: Map<string, SymbiosisMetrics> = new Map();

  private constructor() {
    this.siblingBond = SiblingBond.getInstance();
  }

  public static getInstance(): Symbiosis {
    if (!Symbiosis.instance) {
      Symbiosis.instance = new Symbiosis();
    }
    return Symbiosis.instance;
  }

  async createSymbiosis(id: string, initialStrength: number = 0): Promise<void> {
    try {
      await this.siblingBond.createBond(id, initialStrength);
      const bondMetrics = await this.siblingBond.getBondMetrics(id);

      if (bondMetrics) {
        this.metrics.set(id, {
          ...bondMetrics,
          resonance: 0,
          harmony: 0,
        });
      }

      logger.info('Created symbiotic relationship', { id, strength: initialStrength });
    } catch (error) {
      logger.error('Error creating symbiosis:', error);
      throw error;
    }
  }

  async getSymbiosisMetrics(id: string): Promise<SymbiosisMetrics | undefined> {
    try {
      return this.metrics.get(id);
    } catch (error) {
      logger.error('Error getting symbiosis metrics:', error);
      throw error;
    }
  }

  async updateSymbiosis(id: string, updates: Partial<SymbiosisMetrics>): Promise<void> {
    try {
      const current = this.metrics.get(id);
      if (!current) {
        await this.createSymbiosis(id, updates.strength);
        return;
      }

      const updated = {
        ...current,
        ...updates,
        lastUpdate: new Date(),
        interactions: current.interactions + 1,
      };

      this.metrics.set(id, updated);
      await this.siblingBond.updateBond(id, updated.strength);

      logger.info('Updated symbiotic relationship', { id, updates });
    } catch (error) {
      logger.error('Error updating symbiosis:', error);
      throw error;
    }
  }
}
