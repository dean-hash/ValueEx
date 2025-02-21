import fetch from 'node-fetch';

export class MeetingJoiner {
  private graphEndpoint = 'https://graph.microsoft.com/v1.0';

  async joinTeamsMeeting(meetingId: string, token: string) {
    const joinUrl = `${this.graphEndpoint}/communications/calls`;

    const response = await fetch(joinUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        '@odata.type': '#microsoft.graph.call',
        callbackUri: 'https://bot.contoso.com/callback',
        targets: [
          {
            '@odata.type': '#microsoft.graph.invitationParticipantInfo',
            identity: {
              '@odata.type': '#microsoft.graph.identitySet',
              application: {
                '@odata.type': '#microsoft.graph.identity',
                displayName: 'Cascade Bot',
                id: process.env.BOT_ID,
              },
            },
          },
        ],
        requestedModalities: ['audio'],
        mediaConfig: {
          '@odata.type': '#microsoft.graph.serviceHostedMediaConfig',
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to join meeting: ${response.statusText}`);
    }

    return await response.json();
  }
}
