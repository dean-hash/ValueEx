export declare class DataSimulator {
  private static instance;
  private field;
  private revenue;
  private simulationInterval;
  private constructor();
  static getInstance(): DataSimulator;
  startSimulation(): void;
  stopSimulation(): void;
  private initializeNodes;
  private simulateResonance;
}
