export interface DomainMetrics {
    stability: number;
    coherence: number;
}
export interface DomainInfo {
    name: string;
    status: 'active' | 'error' | 'pending';
    resonance: number;
    metrics: DomainMetrics;
}
export interface FieldState {
    domains: DomainInfo[];
    stability: number;
    coherence: number;
    lastUpdated: Date;
}
export interface DomainAvailability {
    available: boolean;
    price?: number;
    error?: string;
}
export interface DomainContext {
    geographic: string[];
    demographic?: string[];
    psychographic?: string[];
    market?: string;
    category?: string;
}
