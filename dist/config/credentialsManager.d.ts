interface Credentials {
    username: string;
    password: string;
    service: string;
}
interface PaymentInfo {
    name: string;
    address: string;
    phone: string;
    ssn: string;
    email: string;
    bankName: string;
    accountNumber: string;
    routingNumber: string;
    swiftCode: string;
}
export declare class CredentialsManager {
    private static instance;
    private credentialsPath;
    private paymentInfoPath;
    private constructor();
    static getInstance(): CredentialsManager;
    private ensureSecureFiles;
    private ensureEnvFile;
    private encryptData;
    private decryptData;
    storeCredentials(credentials: Credentials): Promise<void>;
    getCredentials(service: string): Promise<Credentials | null>;
    storePaymentInfo(info: PaymentInfo): Promise<void>;
    getPaymentInfo(): Promise<PaymentInfo | null>;
}
export {};
