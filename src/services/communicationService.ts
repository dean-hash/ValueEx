import {
  CommunicationIdentityClient,
  CommunicationUserIdentifier,
} from '@azure/communication-identity';
import { AzureCommunicationTokenCredential } from '@azure/communication-common';
import { credentials } from '../../scripts/getGraphToken';

export class CommunicationService {
  private identityClient: CommunicationIdentityClient;

  constructor() {
    this.identityClient = new CommunicationIdentityClient(
      process.env.COMMUNICATION_CONNECTION_STRING!
    );
  }

  async createUserAndToken(): Promise<{
    user: CommunicationUserIdentifier;
    token: string;
    expiresOn: Date;
  }> {
    const user = await this.identityClient.createUser();
    const tokenResponse = await this.identityClient.getToken(user, ['voip', 'chat']);

    return {
      user,
      token: tokenResponse.token,
      expiresOn: tokenResponse.expiresOn,
    };
  }

  async getTokenCredential(token: string): Promise<AzureCommunicationTokenCredential> {
    return new AzureCommunicationTokenCredential(token);
  }

  async refreshToken(user: CommunicationUserIdentifier): Promise<{
    token: string;
    expiresOn: Date;
  }> {
    return await this.identityClient.getToken(user, ['voip', 'chat']);
  }

  async revokeTokens(user: CommunicationUserIdentifier): Promise<void> {
    await this.identityClient.revokeTokens(user);
  }

  async deleteUser(user: CommunicationUserIdentifier): Promise<void> {
    await this.identityClient.deleteUser(user);
  }
}
