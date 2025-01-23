import { DomainInfo, FieldState } from '../types/domainTypes';
export declare class ResonanceVisualizer {
    private state;
    constructor();
    visualizeDomainMetrics(domain: DomainInfo): Promise<void>;
    updateVisualization(state: FieldState): Promise<void>;
}
