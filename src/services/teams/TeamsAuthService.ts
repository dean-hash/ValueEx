import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { ClientSecretCredential } from '@azure/identity';
import { teamsConfig, teamsUsers, TeamsUserConfig } from '../../config/teams.config';
import { Logger } from '../logging/Logger';
import { MetricsCollector } from '../monitoring/Metrics';

export class TeamsAuthService {
    private graphClient: Client;
    private logger: Logger;
    private metrics: MetricsCollector;
    private tokenCredential: ClientSecretCredential;

    constructor() {
        this.logger = new Logger('TeamsAuthService');
        this.metrics = MetricsCollector.getInstance();
        this.initializeAuth();
    }

    private initializeAuth(): void {
        const startTime = Date.now();
        try {
            this.tokenCredential = new ClientSecretCredential(
                teamsConfig.tenantId,
                teamsConfig.clientId,
                teamsConfig.clientSecret
            );

            const authProvider = new TokenCredentialAuthenticationProvider(this.tokenCredential, {
                scopes: ['https://graph.microsoft.com/.default']
            });

            this.graphClient = Client.initWithMiddleware({
                authProvider,
                debugLogging: false
            });

            this.metrics.trackApiMetrics('initialize_auth', {
                latency: Date.now() - startTime,
                success: true
            });

            this.logger.info('Teams authentication initialized successfully');
        } catch (error) {
            this.metrics.trackError('auth_initialization_error');
            this.logger.error('Failed to initialize Teams authentication', error);
            throw error;
        }
    }

    public getGraphClient(): Client {
        return this.graphClient;
    }

    public async validateUser(email: string): Promise<TeamsUserConfig | null> {
        const startTime = Date.now();
        try {
            const user = teamsUsers.find(u => u.email === email);
            if (!user) {
                this.logger.warn(`User not found: ${email}`);
                return null;
            }

            // Verify user exists in Azure AD
            const graphUser = await this.graphClient
                .api(`/users/${email}`)
                .get();

            if (!graphUser) {
                this.logger.warn(`User not found in Azure AD: ${email}`);
                return null;
            }

            this.metrics.trackApiMetrics('validate_user', {
                latency: Date.now() - startTime,
                success: true
            });

            return user;
        } catch (error) {
            this.metrics.trackError('user_validation_error');
            this.logger.error(`Failed to validate user: ${email}`, error);
            return null;
        }
    }

    public async validateToken(token: string): Promise<boolean> {
        const startTime = Date.now();
        try {
            // Validate token with Azure AD
            const response = await fetch('https://graph.microsoft.com/v1.0/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const isValid = response.ok;

            this.metrics.trackApiMetrics('validate_token', {
                latency: Date.now() - startTime,
                success: isValid
            });

            return isValid;
        } catch (error) {
            this.metrics.trackError('token_validation_error');
            this.logger.error('Failed to validate token', error);
            return false;
        }
    }
}
