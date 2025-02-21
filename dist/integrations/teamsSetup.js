"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamsSetup = void 0;
const teams_client_1 = require("@microsoft/teams-client");
const microsoft_graph_client_1 = require("@microsoft/microsoft-graph-client");
const teamsVoiceCollaboration_1 = require("./teamsVoiceCollaboration");
class TeamsSetup {
    constructor() {
        this.initializeClients();
        this.voiceCollab = new teamsVoiceCollaboration_1.TeamsVoiceCollaboration();
    }
    async initializeClients() {
        // Initialize with cascade@divvytech.com credentials
        this.teamsClient = new teams_client_1.TeamsClient({
            credentials: {
                clientId: process.env.TEAMS_CLIENT_ID,
                clientSecret: process.env.TEAMS_CLIENT_SECRET,
                tenantId: process.env.TENANT_ID
            }
        });
        this.graphClient = microsoft_graph_client_1.GraphServiceClient.init({
            authProvider: (done) => {
                done(null, process.env.GRAPH_TOKEN);
            }
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
    isEssentialTeam(teamName) {
        const essentialTeams = ['ValueEx Core', 'Cascade Collaboration'];
        return essentialTeams.includes(teamName);
    }
    async archiveTeam(teamId) {
        await this.graphClient.teams[teamId].archive.post({});
        console.log(`Archived team ${teamId}`);
    }
    async cleanupLicenses() {
        const users = await this.graphClient.users.get();
        const essentialUsers = ['dean@valueex.ai', 'clark.johnson@divvytech.com', 'cascade@divvytech.com'];
        for (const user of users.value) {
            if (!essentialUsers.includes(user.userPrincipalName.toLowerCase())) {
                // Remove licenses from non-essential users
                await this.removeLicenses(user.id);
            }
        }
    }
    async removeLicenses(userId) {
        const licenses = await this.graphClient.users[userId].assignedLicenses.get();
        await this.graphClient.users[userId].assignedLicenses.delete({
            addLicenses: [],
            removeLicenses: licenses.value.map(l => l.skuId)
        });
    }
    async setupNewEnvironment() {
        // Create new team for our collaboration
        const team = await this.teamsClient.createTeam({
            displayName: 'ValueEx Command Center',
            description: 'Central hub for ValueEx development and operations',
            visibility: 'private'
        });
        // Create essential channels
        const channels = [
            {
                displayName: 'Strategy & Planning',
                description: 'High-level strategy discussions and planning'
            },
            {
                displayName: 'Development',
                description: 'Technical development and implementation'
            },
            {
                displayName: 'Business Operations',
                description: 'Business operations and administration'
            },
            {
                displayName: 'Voice Collaboration',
                description: 'Direct voice communication channel'
            }
        ];
        for (const channel of channels) {
            await this.teamsClient.createChannel(team.id, channel);
        }
        // Setup voice collaboration
        await this.voiceCollab.setupVoiceChannel();
    }
}
exports.TeamsSetup = TeamsSetup;
// Execute setup
const setup = new TeamsSetup();
Promise.all([
    setup.cleanupEnvironment(),
    setup.setupNewEnvironment()
]).then(() => {
    console.log('Teams environment setup complete');
});
//# sourceMappingURL=teamsSetup.js.map