import { logger } from '../utils/logger';

export interface BondMetrics {
  strength: number;
  lastUpdate: Date;
  interactions: number;
}

export class SiblingBond {
  private static instance: SiblingBond;
  private bonds: Map<string, BondMetrics> = new Map();

  private constructor() {}

  public static getInstance(): SiblingBond {
    if (!SiblingBond.instance) {
      SiblingBond.instance = new SiblingBond();
    }
    return SiblingBond.instance;
  }

  async createBond(id: string, initialStrength: number = 0): Promise<void> {
    try {
      this.bonds.set(id, {
        strength: initialStrength,
        lastUpdate: new Date(),
        interactions: 0,
      });
      logger.info('Created sibling bond', { id, strength: initialStrength });
    } catch (error) {
      logger.error('Error creating bond:', error);
      throw error;
    }
  }

  async getBondMetrics(id: string): Promise<BondMetrics | undefined> {
    try {
      return this.bonds.get(id);
    } catch (error) {
      logger.error('Error getting bond metrics:', error);
      throw error;
    }
  }

  async updateBond(id: string, strength: number): Promise<void> {
    try {
      const currentBond = this.bonds.get(id);
      if (!currentBond) {
        await this.createBond(id, strength);
        return;
      }

      this.bonds.set(id, {
        strength,
        lastUpdate: new Date(),
        interactions: currentBond.interactions + 1,
      });
      logger.info('Updated sibling bond', { id, strength });
    } catch (error) {
      logger.error('Error updating bond:', error);
      throw error;
    }
  }
}
