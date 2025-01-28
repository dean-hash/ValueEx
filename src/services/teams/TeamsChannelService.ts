import { Client } from '@microsoft/microsoft-graph-client';
import { TeamsAuthService } from './TeamsAuthService';
import { teamsConfig } from '../../config/teams.config';
import { Logger } from '../logging/Logger';
import { MetricsCollector } from '../monitoring/Metrics';

interface TeamsChannel {
  id: string;
  displayName: string;
  description?: string;
  membershipType?: string;
}

interface TeamsTeam {
  id: string;
  displayName: string;
  description?: string;
  channels?: TeamsChannel[];
}

export class TeamsChannelService {
  protected graphClient: Client;
  protected authService: TeamsAuthService;
  protected logger: Logger;
  protected metrics: MetricsCollector;

  constructor() {
    this.authService = new TeamsAuthService();
    this.graphClient = this.authService.getGraphClient();
    this.logger = new Logger('TeamsChannelService');
    this.metrics = MetricsCollector.getInstance();
  }

  public async initializeChannels(): Promise<void> {
    const startTime = Date.now();
    try {
      // Get the default team
      const team = await this.getOrCreateTeam();
      this.logger.info(`Team found/created: ${team.displayName}`);

      // Create configured channels if they don't exist
      for (const channelName of teamsConfig.channels) {
        const channel = await this.getOrCreateChannel(team.id, channelName);
        this.logger.info(`Channel ${channelName} initialized with ID: ${channel.id}`);
      }

      this.metrics.trackApiMetrics('initialize_channels', {
        latency: Date.now() - startTime,
        success: true,
      });
    } catch (error) {
      this.metrics.trackApiMetrics('initialize_channels', {
        latency: Date.now() - startTime,
        success: false,
      });
      this.metrics.trackError('initialize_channels_error');
      this.logger.error('Failed to initialize channels', error);
      throw error;
    }
  }

  protected async getOrCreateTeam(): Promise<TeamsTeam> {
    const startTime = Date.now();
    try {
      // Try to get existing team
      const teams = await this.graphClient
        .api('/teams')
        .filter(`displayName eq '${teamsConfig.defaultTeam}'`)
        .get();

      if (teams.value && teams.value.length > 0) {
        const team = teams.value[0];
        this.metrics.trackApiMetrics('get_team', {
          latency: Date.now() - startTime,
          success: true,
        });
        return team;
      }

      // Create new team if it doesn't exist
      const newTeam = await this.graphClient.api('/teams').post({
        displayName: teamsConfig.defaultTeam,
        description: 'ValueEx Team for Value Exchange Platform',
        visibility: 'private',
      });

      this.metrics.trackApiMetrics('create_team', {
        latency: Date.now() - startTime,
        success: true,
      });
      return newTeam;
    } catch (error) {
      this.metrics.trackApiMetrics('team_operation', {
        latency: Date.now() - startTime,
        success: false,
      });
      this.metrics.trackError('team_operation_error');
      this.logger.error('Failed to get or create team', error);
      throw error;
    }
  }

  protected async getOrCreateChannel(teamId: string, channelName: string): Promise<TeamsChannel> {
    const startTime = Date.now();
    try {
      // Try to get existing channel
      const channels = await this.graphClient
        .api(`/teams/${teamId}/channels`)
        .filter(`displayName eq '${channelName}'`)
        .get();

      if (channels.value && channels.value.length > 0) {
        const channel = channels.value[0];
        this.metrics.trackApiMetrics('get_channel', {
          latency: Date.now() - startTime,
          success: true,
        });
        return channel;
      }

      // Create new channel if it doesn't exist
      const newChannel = await this.graphClient.api(`/teams/${teamId}/channels`).post({
        displayName: channelName,
        description: `Channel for ${channelName}`,
        membershipType: 'standard',
      });

      this.metrics.trackApiMetrics('create_channel', {
        latency: Date.now() - startTime,
        success: true,
      });
      return newChannel;
    } catch (error) {
      this.metrics.trackApiMetrics('channel_operation', {
        latency: Date.now() - startTime,
        success: false,
      });
      this.metrics.trackError('channel_operation_error');
      this.logger.error(`Failed to get or create channel ${channelName}`, error);
      throw error;
    }
  }

  public async sendMessage(channelId: string, message: string): Promise<boolean> {
    const startTime = Date.now();
    try {
      await this.graphClient.api(`/chats/${channelId}/messages`).post({
        body: {
          contentType: 'text',
          content: message,
        },
      });

      this.metrics.trackApiMetrics('send_message', {
        latency: Date.now() - startTime,
        success: true,
      });
      return true;
    } catch (error) {
      this.metrics.trackApiMetrics('send_message', {
        latency: Date.now() - startTime,
        success: false,
      });
      this.metrics.trackError('send_message_error');
      this.logger.error(`Failed to send message to channel ${channelId}`, error);
      return false;
    }
  }

  public async addMember(channelId: string, userEmail: string): Promise<boolean> {
    const startTime = Date.now();
    try {
      await this.graphClient.api(`/chats/${channelId}/members`).post({
        '@odata.type': '#microsoft.graph.aadUserConversationMember',
        roles: ['owner'],
        'user@odata.bind': `https://graph.microsoft.com/v1.0/users/${userEmail}`,
      });

      this.metrics.trackApiMetrics('add_member', {
        latency: Date.now() - startTime,
        success: true,
      });
      return true;
    } catch (error) {
      this.metrics.trackApiMetrics('add_member', {
        latency: Date.now() - startTime,
        success: false,
      });
      this.metrics.trackError('add_member_error');
      this.logger.error(`Failed to add member ${userEmail} to channel ${channelId}`, error);
      return false;
    }
  }
}
