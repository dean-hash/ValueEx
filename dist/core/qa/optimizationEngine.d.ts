import { EventEmitter } from 'events';
export declare class OptimizationEngine extends EventEmitter {
  private static instance;
  private metricsCollector;
  private resonanceField;
  private strategies;
  private isOptimizing;
  private constructor();
  static getInstance(): OptimizationEngine;
  private initializeStrategies;
  private startMonitoring;
  private checkAndOptimize;
  private handleAnomalies;
  private createDynamicStrategy;
  private optimizeMemory;
  private optimizeApiResponse;
  private optimizeErrorHandling;
  private optimizeDynamic;
}
