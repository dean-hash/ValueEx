import { UnifiedIntelligenceField } from '../unified/intelligenceField';
import { RevenueTracker } from '../../services/affiliate/revenueTracker';

export class DataSimulator {
  private static instance: DataSimulator;
  private field = UnifiedIntelligenceField.getInstance();
  private revenue = RevenueTracker.getInstance();
  private simulationInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): DataSimulator {
    if (!DataSimulator.instance) {
      DataSimulator.instance = new DataSimulator();
    }
    return DataSimulator.instance;
  }

  startSimulation() {
    this.initializeNodes();

    // Start periodic updates
    this.simulationInterval = setInterval(() => {
      // Simulate resonance patterns
      this.simulateResonance();

      // Simulate income verification
      const amount = Math.random() * 1000;
      this.revenue.trackVerifiedIncome(amount);
    }, 2000); // Update every 2 seconds
  }

  stopSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }

  private initializeNodes(): void {
    // Initialize three nodes in a triangle formation
    this.field.addNodeToUnifiedField('node1', [0, 0, 0], 1);
    this.field.addNodeToUnifiedField('node2', [1, 0, 0], 1);
    this.field.addNodeToUnifiedField('node3', [0.5, 0.866, 0], 1);
    this.field.connectNodesInUnifiedField('node1', 'node2');
    this.field.connectNodesInUnifiedField('node2', 'node3');
  }

  private simulateResonance(): void {
    const nodeIds = ['node1', 'node2', 'node3'];
    const randomNode = nodeIds[Math.floor(Math.random() * nodeIds.length)];
    const amplitude = Math.random() * 2;
    this.field.emitResonanceWaveInUnifiedField(randomNode, amplitude);
  }
}
