interface DeploymentConfig {
    name: string;
    gitSource?: {
        repo: string;
        branch?: string;
    };
    buildCommand?: string;
    outputDirectory?: string;
}
interface DeploymentResult {
    isConfigured: boolean;
    isHttpsEnabled: boolean;
    url: string;
}
export declare class VercelConnector {
    private static instance;
    private client;
    private teamId?;
    private constructor();
    static getInstance(): VercelConnector;
    createDeployment(config: DeploymentConfig): Promise<DeploymentResult>;
}
export {};
