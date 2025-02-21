interface DNSRecord {
    type: 'A' | 'CNAME' | 'MX' | 'TXT' | 'NS';
    name: string;
    data: string;
    ttl: number;
}
interface DomainListingOptions {
    price: number;
    description: string;
}
interface DomainListingResult {
    success: boolean;
    domain: string;
    price: number;
}
interface DomainInfo {
    domain: string;
    status: string;
    expires: string;
}
export declare class GoDaddyConnector {
    private static instance;
    private config;
    private axiosInstance;
    private credentialsManager;
    private retryCount;
    private retryDelay;
    private constructor();
    static getInstance(): GoDaddyConnector;
    private withRetry;
    checkAvailability(domain: string): Promise<boolean>;
    purchaseDomain(domain: string): Promise<void>;
    configureDNS(domain: string, records: DNSRecord[]): Promise<void>;
    getDomainStatus(domain: string): Promise<any>;
    setupVercelDNS(domain: string): Promise<void>;
    listDomains(): Promise<DomainInfo[]>;
    getDomains(): Promise<string[]>;
    listDomainForSale(domain: string, options: DomainListingOptions): Promise<DomainListingResult>;
    updatePaymentMethod(paymentInfo: {
        cardNumber: string;
        expiryMonth: string;
        expiryYear: string;
        cvv: string;
        firstName: string;
        lastName: string;
        address: string;
        city: string;
        state: string;
        zip: string;
    }): Promise<boolean>;
}
export {};
