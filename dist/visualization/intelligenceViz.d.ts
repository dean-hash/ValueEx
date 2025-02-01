export default IntelligenceViz;
export type DemandSignal = import('../services/analysis/types').DemandSignal;
export type DemandContext = import('../services/analysis/types').DemandContext;
export type ValuePattern = import('../services/analysis/types').ValuePattern;
export type PerformancePatterns = {
  [x: string]: {
    [key: string]: string[];
  };
};
/**
 * @typedef {import('../services/analysis/types').DemandSignal} DemandSignal
 * @typedef {import('../services/analysis/types').DemandContext} DemandContext
 * @typedef {import('../services/analysis/types').ValuePattern} ValuePattern
 * @typedef {Object.<string, { [key: string]: string[] }>} PerformancePatterns
 */
/**
 * Visualization component for intelligence data
 */
declare class IntelligenceViz {
  /** @type {any} */
  selectedNode: any;
  /** @type {d3.Selection<HTMLDivElement, unknown, null, undefined>} */
  detailsPanel: d3.Selection<HTMLDivElement, unknown, null, undefined>;
  /** @type {d3.Selection<SVGGElement, unknown, null, undefined>} */
  nodeGroups: d3.Selection<SVGGElement, unknown, null, undefined>;
  /** @type {Array<{timestamp: number, type: string, data: any}>} */
  systemEvents: Array<{
    timestamp: number;
    type: string;
    data: any;
  }>;
  /** @type {PerformancePatterns} */
  performancePatterns: PerformancePatterns;
  width: number;
  height: number;
  demandSignals: {
    valueIndicators: string[];
    regions: string[];
    industries: string[];
  };
  providers: (
    | {
        id: string;
        name: string;
        type: string;
        description: string;
        metrics: {
          activeSignals: number;
          confidence: number;
          patterns: any[];
          signals?: undefined;
          insights?: undefined;
          predictions?: undefined;
        };
      }
    | {
        id: string;
        name: string;
        type: string;
        description: string;
        metrics: {
          signals: any[];
          confidence: number;
          insights: any[];
          activeSignals?: undefined;
          patterns?: undefined;
          predictions?: undefined;
        };
      }
    | {
        id: string;
        name: string;
        type: string;
        description: string;
        metrics: {
          patterns: any[];
          confidence: number;
          predictions: any[];
          activeSignals?: undefined;
          signals?: undefined;
          insights?: undefined;
        };
      }
  )[];
  /**
   * Initializes the visualization components.
   * @private
   */
  private initializeVisualization;
  /**
   * Creates a geographic value heat map visualization
   * @private
   */
  private createValueMap;
  /**
   * Creates a timeline visualization of value signals
   * @private
   */
  private createSignalTimeline;
  /**
   * Creates a correlation matrix visualization
   * @private
   */
  private createCorrelationMatrix;
  /**
   * Updates the timeline visualization with new signals
   * @param {Array<DemandSignal>} signals
   */
  updateTimeline(signals: Array<DemandSignal>): void;
  /**
   * Updates the timeline visualization
   */
  updateTimeline(): void;
  /**
   * Processes an incoming value signal
   * @param {DemandSignal} signal
   */
  processValueSignal(signal: DemandSignal): void;
  /**
   * Analyzes the value indicators of a signal
   * @param {DemandSignal} signal
   * @returns {Object}
   */
  analyzeValueIndicators(signal: DemandSignal): any;
  /**
   * Calculates the strength of a value signal
   * @param {DemandSignal} signal
   * @returns {number}
   */
  calculateSignalStrength(signal: DemandSignal): number;
  /**
   * Finds correlations between different value indicators
   * @param {DemandSignal} signal
   * @returns {Array}
   */
  findCorrelations(signal: DemandSignal): any[];
  /**
   * Generates demand predictions based on value signals
   * @param {DemandSignal} signal
   * @returns {Array}
   */
  generatePredictions(signal: DemandSignal): any[];
  /**
   * Initializes real-time processing of value signals
   * @private
   */
  private initializeRealTimeProcessing;
  /**
   * Gets the current system metrics
   * @returns {Object}
   */
  getSystemMetrics(): any;
  /**
   * Generates contextual insights based on system metrics
   * @param {Object} metrics
   * @returns {Array}
   */
  generateContextualInsights(metrics: any): any[];
  /**
   * Gets resource insights based on a specific metric
   * @param {string} type
   * @param {number} value
   * @returns {Array}
   */
  getResourceInsights(type: string, value: number): any[];
  /**
   * Checks if a system event is significant
   * @param {Object} metrics
   * @returns {boolean}
   */
  isSignificantEvent(metrics: any): boolean;
  /**
   * Records a significant system event
   * @param {Object} metrics
   * @param {Array} insights
   */
  recordEvent(metrics: any, insights: any[]): void;
  /**
   * Determines the type of a system event
   * @param {Object} metrics
   * @returns {string}
   */
  determineEventType(metrics: any): string;
  /**
   * Enhances the signal flow based on system load
   * @param {Object} metrics
   */
  enhanceSignalFlow(metrics: any): void;
  /**
   * Updates the metrics visualization
   */
  updateMetrics(): void;
  /**
   * Updates the detail panel for a selected node
   * @param {Object} node
   */
  updateDetailPanel(node: any): void;
  /**
   * Gets the HTML for a node's metrics
   * @param {Object} node
   * @returns {string}
   */
  getMetricsHtml(node: any): string;
  /**
   * Gets the HTML for a provider's details
   * @param {Object} node
   * @returns {string}
   */
  getProviderDetails(node: any): string;
  /**
   * Renders a list of patterns
   * @param {Array} patterns
   * @returns {string}
   */
  renderPatterns(patterns: any[]): string;
  /**
   * Renders a list of insights
   * @param {Array} insights
   * @returns {string}
   */
  renderInsights(insights: any[]): string;
  /**
   * Renders resource metrics
   * @param {Object} metrics
   * @returns {string}
   */
  renderResourceMetrics(metrics: any): string;
}
import * as d3 from 'd3';
import { DemandSignal } from '../services/analysis/types';
