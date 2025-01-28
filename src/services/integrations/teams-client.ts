import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { ClientSecretCredential } from '@azure/identity';
import { configService } from '../../config/configService';
import { logger } from '../../utils/logger';

interface Channel {
  displayName: string;
  description: string;
}

interface Message {
  body: {
    content: string;
    contentType: 'html';
  };
}

interface Meeting {
  startDateTime: string;
  endDateTime: string;
  subject: string;
  participants: {
    attendees: Array<{ upn: string }>;
  };
}

export class TeamsClient {
  private static instance: TeamsClient;
  private graphClient: Client;
  private credential: ClientSecretCredential;

  private constructor() {
    this.credential = new ClientSecretCredential(
      configService.get('AZURE_TENANT_ID'),
      configService.get('AZURE_CLIENT_ID'),
      configService.get('AZURE_CLIENT_SECRET')
    );

    const authProvider = new TokenCredentialAuthenticationProvider(this.credential, {
      scopes: ['https://graph.microsoft.com/.default'],
    });

    this.graphClient = Client.initWithMiddleware({
      authProvider,
    });
  }

  public static getInstance(): TeamsClient {
    if (!TeamsClient.instance) {
      TeamsClient.instance = new TeamsClient();
    }
    return TeamsClient.instance;
  }

  async createChannel(teamId: string, channelName: string, description: string): Promise<Channel> {
    try {
      const channel = await this.graphClient.api(`/teams/${teamId}/channels`).post({
        displayName: channelName,
        description: description,
      });
      logger.info('Teams channel created:', { channelName, teamId });
      return channel;
    } catch (error) {
      logger.error('Failed to create Teams channel:', error);
      throw error;
    }
  }

  async sendMessage(channelId: string, content: string): Promise<Message> {
    try {
      const message = await this.graphClient.api(`/teams/${channelId}/messages`).post({
        body: {
          content: content,
          contentType: 'html',
        },
      });
      logger.info('Message sent to Teams channel:', { channelId });
      return message;
    } catch (error) {
      logger.error('Failed to send Teams message:', error);
      throw error;
    }
  }

  async scheduleTeamsMeeting(subject: string, attendees: string[]): Promise<Meeting> {
    try {
      const meeting = await this.graphClient.api('/me/onlineMeetings').post({
        startDateTime: new Date().toISOString(),
        endDateTime: new Date(Date.now() + 3600000).toISOString(),
        subject: subject,
        participants: {
          attendees: attendees.map((email) => ({
            upn: email,
          })),
        },
      });
      logger.info('Teams meeting scheduled:', { subject });
      return meeting;
    } catch (error) {
      logger.error('Failed to schedule Teams meeting:', error);
      throw error;
    }
  }

  async joinTeamsMeeting(meetingId: string): Promise<{ joinUrl: string }> {
    try {
      const joinInfo = await this.graphClient
        .api(`/me/onlineMeetings/${meetingId}/joinWebUrl`)
        .get();
      logger.info('Joined Teams meeting:', { meetingId });
      return joinInfo;
    } catch (error) {
      logger.error('Failed to join Teams meeting:', error);
      throw error;
    }
  }
}
