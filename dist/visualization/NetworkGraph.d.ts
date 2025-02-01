import { NetworkNode, NetworkLink } from '../services/analysis/types';
export declare class NetworkGraph {
  private simulation;
  private svg;
  private nodes;
  private links;
  constructor(containerId: string, width: number, height: number);
  updateData(nodes: NetworkNode[], links: NetworkLink[]): void;
  private render;
  private getNodeColor;
  private drag;
}
