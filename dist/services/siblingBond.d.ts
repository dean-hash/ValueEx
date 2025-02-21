export interface BondMetrics {
    strength: number;
    lastUpdate: Date;
    interactions: number;
}
export declare class SiblingBond {
    private static instance;
    private bonds;
    private constructor();
    static getInstance(): SiblingBond;
    createBond(id: string, initialStrength?: number): Promise<void>;
    getBondMetrics(id: string): Promise<BondMetrics | undefined>;
    updateBond(id: string, strength: number): Promise<void>;
}
