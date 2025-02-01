import { Observable } from 'rxjs';
export interface ValueNode {
  id: string;
  type: 'PRODUCT' | 'MARKET' | 'USER' | 'OPPORTUNITY';
  data: any;
  connections: Array<{
    nodeId: string;
    type: string;
    strength: number;
  }>;
  metrics: {
    currentValue: number;
    potentialValue: number;
    confidence: number;
    momentum: number;
  };
}
export declare class ValueNetwork {
  private intelligence;
  private valueNodes;
  constructor();
  private initializeValueNetwork;
  private processIntelligenceNetwork;
  private convertIntelligenceToValueNode;
  private determineNodeType;
  private extractNodeData;
  private calculateNodeMetrics;
  private calculateCurrentValue;
  private calculatePotentialValue;
  private calculateMomentum;
  private optimizeValueNetwork;
  private updateValueNetwork;
  findHighValueOpportunities(context?: any): Promise<ValueNode[]>;
  private rankOpportunities;
  observeValueNetwork(): Observable<Map<string, ValueNode>>;
}
