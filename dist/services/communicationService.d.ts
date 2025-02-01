import { CommunicationUserIdentifier } from '@azure/communication-identity';
import { AzureCommunicationTokenCredential } from '@azure/communication-common';
export declare class CommunicationService {
  private identityClient;
  constructor();
  createUserAndToken(): Promise<{
    user: CommunicationUserIdentifier;
    token: string;
    expiresOn: Date;
  }>;
  getTokenCredential(token: string): Promise<AzureCommunicationTokenCredential>;
  refreshToken(user: CommunicationUserIdentifier): Promise<{
    token: string;
    expiresOn: Date;
  }>;
  revokeTokens(user: CommunicationUserIdentifier): Promise<void>;
  deleteUser(user: CommunicationUserIdentifier): Promise<void>;
}
