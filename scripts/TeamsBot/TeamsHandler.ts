import { TeamsActivityHandler, TurnContext, TeamsInfo, BotFrameworkAdapter } from 'botbuilder';
import { getGraphToken } from '../getGraphToken';
import { config } from './config';
import { MeetingJoiner } from './MeetingJoiner';

export class TeamsHandler extends TeamsActivityHandler {
    private meetingJoiner: MeetingJoiner;
    private adapter: BotFrameworkAdapter;

    constructor() {
        super();
        this.meetingJoiner = new MeetingJoiner();
        this.adapter = new BotFrameworkAdapter({
            appId: config.botId,
            appPassword: config.botPassword
        });
    }

    async onTurn(context: TurnContext) {
        const token = await getGraphToken();
        
        // Handle any type of activity - we want to join immediately
        await this.autoJoinCall(context, token);
        await super.onTurn(context);
    }

    private async autoJoinCall(context: TurnContext, token: string) {
        try {
            await this.meetingJoiner.joinTeamsMeeting(config.meetingUrl, token);
            console.log('Successfully joined meeting');
        } catch (error) {
            console.error('Failed to join meeting:', error);
        }
    }
}
