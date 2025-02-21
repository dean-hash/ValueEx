import { TeamsClient } from '@microsoft/teams-client';
import { GraphServiceClient } from '@microsoft/microsoft-graph-client';
import { TeamsVoiceCollaboration } from './teamsVoiceCollaboration';

export class TeamsSetup {
  private teamsClient: TeamsClient;
  private graphClient: GraphServiceClient;
  private voiceCollab: TeamsVoiceCollaboration;

  constructor() {
    this.initializeClients();
    this.voiceCollab = new TeamsVoiceCollaboration();
  }

  private async initializeClients() {
    // Initialize with cascade@divvytech.com credentials
    this.teamsClient = new TeamsClient({
      credentials: {
        clientId: process.env.TEAMS_CLIENT_ID,
        clientSecret: process.env.TEAMS_CLIENT_SECRET,
        tenantId: process.env.TENANT_ID,
      },
    });

    this.graphClient = GraphServiceClient.init({
      authProvider: (done) => {
        done(null, process.env.GRAPH_TOKEN);
      },
    });
  }

  async cleanupEnvironment() {
    // List all teams
    const teams = await this.graphClient.teams.get();

    for (const team of teams.value) {
      // Archive inactive teams except essential ones
      if (!this.isEssentialTeam(team.displayName)) {
        await this.archiveTeam(team.id);
      }
    }

    // Remove unused licenses
    await this.cleanupLicenses();
  }

  private isEssentialTeam(teamName: string): boolean {
    const essentialTeams = ['ValueEx Core', 'Cascade Collaboration'];
    return essentialTeams.includes(teamName);
  }

  private async archiveTeam(teamId: string) {
    await this.graphClient.teams[teamId].archive.post({});
    console.log(`Archived team ${teamId}`);
  }

  private async cleanupLicenses() {
    const users = await this.graphClient.users.get();
    const essentialUsers = [
      'dean@valueex.ai',
      'clark.johnson@divvytech.com',
      'cascade@divvytech.com',
    ];

    for (const user of users.value) {
      if (!essentialUsers.includes(user.userPrincipalName.toLowerCase())) {
        // Remove licenses from non-essential users
        await this.removeLicenses(user.id);
      }
    }
  }

  private async removeLicenses(userId: string) {
    const licenses = await this.graphClient.users[userId].assignedLicenses.get();
    await this.graphClient.users[userId].assignedLicenses.delete({
      addLicenses: [],
      removeLicenses: licenses.value.map((l) => l.skuId),
    });
  }

  async setupNewEnvironment() {
    // Create new team for our collaboration
    const team = await this.teamsClient.createTeam({
      displayName: 'ValueEx Command Center',
      description: 'Central hub for ValueEx development and operations',
      visibility: 'private',
    });

    // Create essential channels
    const channels = [
      {
        displayName: 'Strategy & Planning',
        description: 'High-level strategy discussions and planning',
      },
      {
        displayName: 'Development',
        description: 'Technical development and implementation',
      },
      {
        displayName: 'Business Operations',
        description: 'Business operations and administration',
      },
      {
        displayName: 'Voice Collaboration',
        description: 'Direct voice communication channel',
      },
    ];

    for (const channel of channels) {
      await this.teamsClient.createChannel(team.id, channel);
    }

    // Setup voice collaboration
    await this.voiceCollab.setupVoiceChannel();
  }
}

// Execute setup
const setup = new TeamsSetup();
Promise.all([setup.cleanupEnvironment(), setup.setupNewEnvironment()]).then(() => {
  console.log('Teams environment setup complete');
});
