import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { MetricsCollector } from '../../services/monitoring/Metrics';
import { Logger } from '../../services/logging/Logger';
import { TeamsChannelService } from '../../services/teams/TeamsChannelService';
import { MatchRequest, Match, Product, DemandSignal } from './types';
import { logger } from '../../utils/logger';
import { configService } from '../../config/configService';
import { Product as MVPProduct } from '../../types/mvp/product';
import { Demand as MVDDemand } from '../../types/mvp/demand';

export class MatchingEngine {
    private static instance: MatchingEngine;
    private workers: Worker[] = [];
    private metrics: MetricsCollector;
    private logger: Logger;
    private teamsService: TeamsChannelService;
    private readonly minMatchScore: number;
    private readonly maxConcurrentMatches: number;

    private constructor() {
        this.metrics = MetricsCollector.getInstance();
        this.logger = Logger.getInstance();
        this.teamsService = new TeamsChannelService();
        this.minMatchScore = parseFloat(configService.get('MIN_MATCH_SCORE'));
        this.maxConcurrentMatches = parseInt(configService.get('MAX_CONCURRENT_MATCHES'));
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
            this.workers.push(worker);
        }
    }

    public async findMatches(request: MatchRequest): Promise<Match[]> {
        try {
            const startTime = Date.now();
            const matches = await this.distributeWork(request);
            const duration = Date.now() - startTime;

            this.metrics.trackApiMetrics('findMatches', duration, matches.length);
            
            // Notify about high-confidence matches
            matches
                .filter(match => match.matchScore > 0.8)
                .forEach(match => this.notifyMatch(match));

            return matches;
        } catch (error) {
            this.logger.error('Error in findMatches:', error);
            this.metrics.trackError('findMatches', error);
            throw error;
        }
    }

    private async distributeWork(request: MatchRequest): Promise<Match[]> {
        const chunkSize = Math.ceil(request.products.length / this.workers.length);
        const promises = this.workers.map((worker, index) => {
            const start = index * chunkSize;
            const end = start + chunkSize;
            const chunk = {
                products: request.products.slice(start, end),
                demandSignals: request.demandSignals,
                minMatchScore: request.minMatchScore,
                maxResults: request.maxResults
            };
            return this.processChunk(worker, chunk);
        });

        const results = await Promise.all(promises);
        return this.mergeAndSortResults(results.flat());
    }

    private processChunk(worker: Worker, chunk: MatchRequest): Promise<Match[]> {
        return new Promise((resolve, reject) => {
            worker.postMessage(chunk);
            worker.once('message', resolve);
            worker.once('error', reject);
        });
    }

    private mergeAndSortResults(matches: Match[]): Match[] {
        return matches
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, 100); // Limit to top 100 matches
    }

    private async notifyMatch(match: Match) {
        try {
            const message = this.formatMatchNotification(match);
            await this.teamsService.sendMessage(message);
        } catch (error) {
            this.logger.error('Error notifying match:', error);
            this.metrics.trackError('notifyMatch', error);
        }
    }

    private formatMatchNotification(match: Match): string {
        return `🎯 New High-Confidence Match!\n\n` +
               `Product: ${match.productId}\n` +
               `Demand Signal: ${match.demandSignalId}\n` +
               `Match Score: ${(match.matchScore * 100).toFixed(1)}%\n` +
               `Reasons: ${match.matchReason.join(', ')}\n\n` +
               `Category Match: ${match.metadata.categoryMatch ? '✅' : '❌'}\n` +
               `Price Match: ${match.metadata.priceMatch ? '✅' : '❌'}\n` +
               `Description Similarity: ${(match.metadata.descriptionSimilarity * 100).toFixed(1)}%`;
    }

    public async findProductMatches(
        product: MVPProduct,
        demandSignals: MVDDemand[],
        minMatchScore: number
    ): Promise<Match[]> {
        const matches: Match[] = [];

        for (const signal of demandSignals) {
            const score = await this.calculateMatchScore(product, signal);
            if (score >= minMatchScore) {
                matches.push({
                    demand: signal,
                    product: product,
                    matchScore: score,
                    matchReason: this.generateMatchReasons(product, signal),
                    metadata: {
                        timestamp: new Date(),
                        confidence: signal.confidence
                    }
                });
            }
        }

        return matches;
    }

    private async calculateMatchScore(product: MVPProduct, signal: MVDDemand): Promise<number> {
        // Implement your matching logic here
        // This is a simplified example - you should implement more sophisticated matching
        let score = 0;

        // Category match
        if (product.category.toLowerCase() === signal.category.toLowerCase()) {
            score += 0.5;
        }

        // Price range match
        if (signal.priceRange && product.price >= signal.priceRange.min && product.price <= signal.priceRange.max) {
            score += 0.3;
        }

        // Metadata match
        const metadataMatchScore = this.calculateMetadataMatchScore(product.metadata, signal.metadata);
        score += metadataMatchScore * 0.2;

        return score;
    }

    private calculateMetadataMatchScore(
        productMetadata: Record<string, unknown>,
        signalMetadata: Record<string, unknown>
    ): number {
        let matches = 0;
        let total = 0;

        for (const [key, value] of Object.entries(signalMetadata)) {
            if (key in productMetadata && productMetadata[key] === value) {
                matches++;
            }
            total++;
        }

        return total > 0 ? matches / total : 0;
    }

    private generateMatchReasons(product: MVPProduct, signal: MVDDemand): string[] {
        const reasons: string[] = [];

        if (product.category.toLowerCase() === signal.category.toLowerCase()) {
            reasons.push('Category match');
        }

        if (signal.priceRange && product.price >= signal.priceRange.min && product.price <= signal.priceRange.max) {
            reasons.push('Price range match');
        }

        // Add more reasons based on your matching logic

        return reasons;
    }
}

// Worker thread code
if (!isMainThread) {
    const { workerId } = workerData;
    
    parentPort?.on('message', async (request: MatchRequest) => {
        const matches = await findMatchesWorker(request);
        parentPort?.postMessage(matches);
    });
}

async function findMatchesWorker(request: MatchRequest): Promise<Match[]> {
    const matches: Match[] = [];
    const { products, demandSignals, minMatchScore = 0.5 } = request;

    for (const product of products) {
        for (const demand of demandSignals) {
            const match = calculateMatch(product, demand);
            if (match.matchScore >= minMatchScore) {
                matches.push(match);
            }
        }
    }

    return matches;
}

function calculateMatch(product: Product, demand: DemandSignal): Match {
    const categoryMatch = product.category === demand.category;
    const priceMatch = isPriceMatch(product.price, demand.priceRange);
    const descriptionSimilarity = calculateSimilarity(product.description, demand.description);

    const matchScore = (
        (categoryMatch ? 0.4 : 0) +
        (priceMatch ? 0.3 : 0) +
        (descriptionSimilarity * 0.3)
    ) * (demand.confidence || 1);

    return {
        productId: product.id,
        demandSignalId: demand.id,
        matchScore,
        matchReason: generateMatchReasons(categoryMatch, priceMatch, descriptionSimilarity),
        metadata: {
            categoryMatch,
            priceMatch,
            descriptionSimilarity
        }
    };
}

function isPriceMatch(price: number, range?: { min: number; max: number }): boolean {
    if (!range) return true;
    return price >= range.min && price <= range.max;
}

function calculateSimilarity(text1: string, text2: string): number {
    // Simple Jaccard similarity for now
    const words1 = new Set(text1.toLowerCase().split(/\W+/));
    const words2 = new Set(text2.toLowerCase().split(/\W+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
}

function generateMatchReasons(categoryMatch: boolean, priceMatch: boolean, similarity: number): string[] {
    const reasons: string[] = [];
    
    if (categoryMatch) reasons.push('Category match');
    if (priceMatch) reasons.push('Price within range');
    if (similarity > 0.5) reasons.push('High description similarity');
    
    return reasons;
}
