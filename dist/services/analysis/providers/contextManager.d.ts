import { EventEmitter } from 'events';
import { DependencyGraph } from '../utils/dependencyGraph';
import type { DemandSignal, IntelligenceProvider } from '../types';
interface ComponentMetadata {
  id: string;
  name: string;
  path: string;
  type: string;
  dependencies: string[];
  exports: string[];
  lastModified: number;
  functions: Array<{
    name: string;
    params: string[];
    returnType: string;
  }>;
}
interface ComponentContext {
  id: string;
  name: string;
  type: string;
  features: string[];
  metadata: ComponentMetadata;
}
interface SystemContext {
  components: Map<string, ComponentContext>;
  relationships: DependencyGraph;
  recentChanges: Array<{
    component: string;
    timestamp: number;
    change: string;
    impact: {
      direct: string[];
      indirect: string[];
    };
  }>;
  health: {
    lastCheck: number;
    status: 'healthy' | 'warning' | 'error';
    metrics: {
      componentCount: number;
      errorCount: number;
      warningCount: number;
      avgDependencyDepth: number;
    };
  };
}
export declare class ContextManager extends EventEmitter implements IntelligenceProvider {
  name: string;
  type: 'context';
  confidence: number;
  private readonly watcher;
  private readonly components;
  private readonly dependencyGraph;
  private readonly healthStatus;
  private projectRoot;
  private context;
  constructor(projectRoot: string);
  private initialize;
  private scanProject;
  private findTypeScriptFiles;
  private analyzeComponent;
  private setupFileWatcher;
  private handleFileChange;
  private handleFileDelete;
  private analyzeRelationships;
  private validateRelationships;
  private analyzeChangeImpact;
  private checkFunctionChanges;
  private startHealthMonitoring;
  private performHealthCheck;
  private checkComponentHealth;
  private checkMissingDependencies;
  private checkOutdatedDependencies;
  private updateSystemHealth;
  private updateSystemMetrics;
  private extractMetadata;
  private determineComponentType;
  private inferComponentPurpose;
  private resolveDependencyPath;
  private updateRelationships;
  getComponentContext(componentPath: string): ComponentContext | undefined;
  getSystemHealth(): SystemContext['health'];
  getDependents(componentPath: string): {
    direct: string[];
    all: Set<string>;
  };
  getRecentChanges(limit?: number): {
    component: string;
    timestamp: number;
    change: string;
    impact: {
      direct: string[];
      indirect: string[];
    };
  }[];
  processSignal(signal: DemandSignal): Promise<DemandSignal>;
  validateAlignment(): Promise<boolean>;
  private findRelatedComponents;
  private calculateMatchConfidence;
}
export {};
