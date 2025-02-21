interface GithubPagesConfig {
    owner: string;
    repo: string;
    branch: string;
    domain?: string;
}
export declare class GithubPagesConnector {
    private static instance;
    private octokit;
    private config;
    private constructor();
    static getInstance(): GithubPagesConnector;
    enablePages(config: GithubPagesConfig): Promise<void>;
    getPageStatus(owner: string, repo: string): Promise<{
        url: any;
        status: any;
        enforceHttps: any;
        customDomain: any;
    }>;
    createDeployment(config: GithubPagesConfig): Promise<any>;
    verifyDomainSetup(config: GithubPagesConfig): Promise<true | {
        isConfigured: boolean;
        isHttpsEnabled: any;
        url: any;
    }>;
}
export {};
