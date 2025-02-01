import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

export class AffiliateConnector {
    private static instance: AffiliateConnector;
    private awinBaseUrl: string;
    private awinApiKey: string;
    private awinPublisherId: string;
    private godaddyClient: any;

    private constructor() {
        this.awinBaseUrl = 'https://api.awin.com';
        this.awinApiKey = process.env.AWIN_API_KEY;
        this.awinPublisherId = process.env.AWIN_PUBLISHER_ID;
        this.initializeClients();
    }

    public static getInstance(): AffiliateConnector {
        if (!AffiliateConnector.instance) {
            AffiliateConnector.instance = new AffiliateConnector();
        }
        return AffiliateConnector.instance;
    }

    private initializeClients() {
        // Initialize GoDaddy client
        this.godaddyClient = axios.create({
            baseURL: 'https://api.godaddy.com',
            headers: {
                'Authorization': `sso-key ${process.env.GODADDY_API_KEY}:${process.env.GODADDY_API_SECRET}`,
                'Content-Type': 'application/json'
            }
        });
    }

    private async fetchAwinData(endpoint: string): Promise<any> {
        try {
            const response = await axios.get(`${this.awinBaseUrl}${endpoint}`, {
                headers: {
                    'Authorization': `Bearer ${this.awinApiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        } catch (error: any) {
            console.error(`Error fetching Awin data from ${endpoint}:`, error.response?.data || error.message);
            throw error;
        }
    }

    public async getAwinPrograms(): Promise<any[]> {
        try {
            // First get list of advertisers
            const advertisers = await this.fetchAwinData(`/publishers/${this.awinPublisherId}/programmes`);
            
            if (!Array.isArray(advertisers)) {
                console.warn('Unexpected response format from Awin programmes endpoint:', advertisers);
                return [];
            }
            
            // For each advertiser, get their commission details
            const programsWithCommission = await Promise.all(
                advertisers.map(async (advertiser: any) => {
                    try {
                        const commission = await this.fetchAwinData(
                            `/publishers/${this.awinPublisherId}/commissiongroups?advertiserId=${advertiser.id}`
                        );
                        
                        return {
                            id: advertiser.id,
                            name: advertiser.name,
                            status: advertiser.status,
                            primarySector: advertiser.primaryRegion,
                            commission: this.extractCommissionRate(commission),
                            averageOrder: advertiser.averagePaymentAmount || null,
                            conversionRate: advertiser.conversionRate || null,
                            clickThroughRate: advertiser.clickThroughRate || null,
                            region: advertiser.primaryRegion || 'Unknown'
                        };
                    } catch (error) {
                        console.warn(`Failed to get commission for advertiser ${advertiser.id}:`, error);
                        return null;
                    }
                })
            );

            const validPrograms = programsWithCommission.filter(program => program !== null);
            console.log(`Successfully fetched ${validPrograms.length} programs out of ${advertisers.length} total advertisers`);
            
            return validPrograms;
        } catch (error) {
            console.error('Error getting Awin programs:', error);
            if (axios.isAxiosError(error)) {
                console.error('API Response:', error.response?.data);
            }
            return [];
        }
    }

    private extractCommissionRate(commissionData: any): number {
        if (!commissionData || !Array.isArray(commissionData)) {
            return 0;
        }

        // Find the highest commission rate from all commission groups
        const maxCommission = commissionData.reduce((max, group) => {
            const rate = group.amount || 0;
            return rate > max ? rate : max;
        }, 0);

        return maxCommission;
    }

    public async getAwinTransactions(startDate: string, endDate: string) {
        try {
            const response = await axios.get(`${this.awinBaseUrl}/publishers/${this.awinPublisherId}/transactions`, {
                headers: {
                    'Authorization': `Bearer ${this.awinApiKey}`,
                    'Content-Type': 'application/json'
                },
                params: { startDate, endDate }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching Awin transactions:', error);
            throw error;
        }
    }

    public async getDomains() {
        try {
            const response = await this.godaddyClient.get('/v1/domains');
            return response.data;
        } catch (error) {
            console.error('Error fetching domains:', error);
            throw error;
        }
    }

    public getFiverrLinks() {
        return {
            marketplace: process.env.FIVERR_MARKETPLACE_LINK,
            pro: process.env.FIVERR_PRO_LINK,
            logoMaker: process.env.FIVERR_LOGO_MAKER_LINK,
            subAffiliates: process.env.FIVERR_SUB_AFFILIATES_LINK
        };
    }

    // Handle incoming transaction notifications
    public async handleTransactionNotification(transactionData: any): Promise<void> {
        try {
            // Validate transaction data
            if (!transactionData || !transactionData.transactionId) {
                throw new Error('Invalid transaction data received');
            }

            // Log transaction details
            console.log('Received transaction notification:', {
                id: transactionData.transactionId,
                advertiserId: transactionData.advertiserId,
                commissionAmount: transactionData.commissionAmount,
                saleAmount: transactionData.saleAmount,
                status: transactionData.status
            });

            // Here we would typically:
            // 1. Store the transaction in our database
            // 2. Update any real-time dashboards
            // 3. Trigger any necessary notifications
            
            // For now, we'll just log it
            await this.logTransaction(transactionData);

        } catch (error) {
            console.error('Error handling transaction notification:', error);
            throw error;
        }
    }

    private async logTransaction(transaction: any): Promise<void> {
        // TODO: Implement proper transaction logging
        // This is a placeholder for actual database storage
        console.log('Transaction logged:', {
            timestamp: new Date().toISOString(),
            ...transaction
        });
    }
}
