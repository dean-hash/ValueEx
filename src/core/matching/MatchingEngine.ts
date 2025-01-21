import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { MetricsCollector } from '../../services/monitoring/Metrics';
import { Logger } from '../../services/logging/Logger';
import { TeamsChannelService } from '../../services/teams/TeamsChannelService';

interface MatchRequest {
    userId: string;
    skills: string[];
    interests: string[];
    availability: {
        startTime: string;
        endTime: string;
    };
}

interface Match {
    users: string[];
    matchScore: number;
    commonSkills: string[];
    commonInterests: string[];
}

export class MatchingEngine {
    private static instance: MatchingEngine;
    private workers: Worker[] = [];
    private metrics: MetricsCollector;
    private logger: Logger;
    private teamsService: TeamsChannelService;

    private constructor() {
        this.metrics = MetricsCollector.getInstance();
        this.logger = new Logger('MatchingEngine');
        this.teamsService = new TeamsChannelService();
        this.initializeWorkers();
    }

    public static getInstance(): MatchingEngine {
        if (!MatchingEngine.instance) {
            MatchingEngine.instance = new MatchingEngine();
        }
        return MatchingEngine.instance;
    }

    private initializeWorkers() {
        const numCPUs = require('os').cpus().length;
        for (let i = 0; i < numCPUs; i++) {
            const worker = new Worker(__filename, {
                workerData: { workerId: i }
            });
            
            worker.on('message', this.handleWorkerMessage.bind(this));
            worker.on('error', this.handleWorkerError.bind(this));
            
            this.workers.push(worker);
        }
    }

    private async handleWorkerMessage(message: any) {
        if (message.type === 'match_found') {
            await this.notifyMatch(message.match);
        }
        this.metrics.trackApiMetrics('worker_message', {
            latency: message.duration,
            success: true
        });
    }

    private handleWorkerError(error: Error) {
        this.logger.error('Worker error:', error);
        this.metrics.trackError('worker_error');
    }

    public async findMatches(request: MatchRequest): Promise<Match[]> {
        const startTime = Date.now();
        try {
            // Distribute matching tasks among workers
            const promises = this.workers.map(worker => 
                new Promise((resolve) => {
                    worker.postMessage({
                        type: 'find_matches',
                        request
                    });
                    worker.once('message', resolve);
                })
            );

            const results = await Promise.all(promises);
            const matches = results
                .flatMap(r => (r as any).matches)
                .sort((a, b) => b.matchScore - a.matchScore);

            this.metrics.trackApiMetrics('find_matches', {
                latency: Date.now() - startTime,
                success: true
            });

            return matches;
        } catch (error) {
            this.logger.error('Error finding matches:', error);
            this.metrics.trackError('find_matches_error');
            throw error;
        }
    }

    private async notifyMatch(match: Match) {
        try {
            const message = this.formatMatchNotification(match);
            await this.teamsService.sendMessage(
                process.env.TEAMS_NOTIFICATION_CHANNEL!,
                message
            );
        } catch (error) {
            this.logger.error('Error notifying match:', error);
            this.metrics.trackError('match_notification_error');
        }
    }

    private formatMatchNotification(match: Match): string {
        return `
🎉 New Match Found!
Users: ${match.users.join(', ')}
Match Score: ${match.matchScore}
Common Skills: ${match.commonSkills.join(', ')}
Common Interests: ${match.commonInterests.join(', ')}
        `.trim();
    }
}

// Worker thread code
if (!isMainThread) {
    const { workerId } = workerData;
    
    parentPort?.on('message', async (message) => {
        if (message.type === 'find_matches') {
            const startTime = Date.now();
            const matches = await findMatchesWorker(message.request);
            
            parentPort?.postMessage({
                type: 'match_found',
                matches,
                duration: Date.now() - startTime
            });
        }
    });
}

async function findMatchesWorker(request: MatchRequest): Promise<Match[]> {
    // Implement matching algorithm here
    // This is a placeholder implementation
    return [{
        users: [request.userId, 'matched-user'],
        matchScore: 0.95,
        commonSkills: request.skills,
        commonInterests: request.interests
    }];
}
