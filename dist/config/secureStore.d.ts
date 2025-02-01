interface SecureCredential {
  service: string;
  username: string;
  password: string;
  notes?: string;
}
export declare class SecureStore {
  private static instance;
  private storePath;
  private masterKey;
  private constructor();
  static getInstance(): SecureStore;
  private ensureSecureDirectory;
  private encrypt;
  private decrypt;
  storeCredential(credential: SecureCredential): Promise<void>;
  getCredential(service: string): Promise<SecureCredential | null>;
  private getAllCredentials;
  updateMasterKey(newMasterKey: string): Promise<void>;
}
export {};
