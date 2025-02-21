"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParallelProcessor = void 0;
const events_1 = require("events");
const child_process_1 = require("child_process");
class ParallelProcessor extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.activeTasks = new Map();
        this.results = new Map();
        this.config = config;
        this.metrics = {
            processedCount: 0,
            errorCount: 0,
            avgProcessingTime: 0
        };
    }
    async processInParallel(tasks) {
        const processingTasks = tasks.map((task) => {
            const mistralPromise = this.queryMistral(task.signal);
            const llama2Promise = this.queryLlama2(task.signal);
            const nlpPromise = this.processNLP(task.signal);
            const startTime = Date.now();
            return Promise.all([mistralPromise, llama2Promise, nlpPromise]).then(([mistralResult, llama2Result, nlpResult]) => {
                const processingTime = Date.now() - startTime;
                return {
                    id: task.id,
                    signal: task.signal,
                    timestamp: task.timestamp,
                    analysis: {
                        sentiment: (mistralResult.sentiment + llama2Result.sentiment + nlpResult.sentiment) / 3,
                        topics: this.aggregateTopics([
                            ...(mistralResult.topics || []),
                            ...(llama2Result.topics || []),
                            ...(nlpResult.topics || []),
                        ]),
                        features: this.aggregateFeatures([
                            mistralResult.features || {},
                            llama2Result.features || {},
                            nlpResult.features || {},
                        ]),
                        relationships: {
                            relatedSignals: Array.from(new Set([
                                ...(mistralResult.relatedSignals || []),
                                ...(llama2Result.relatedSignals || []),
                            ])),
                            crossReferences: Array.from(new Set([
                                ...(mistralResult.crossReferences || []),
                                ...(llama2Result.crossReferences || []),
                            ])),
                        },
                    },
                    metadata: {
                        processingTime,
                        provider: 'LocalIntelligence',
                        confidence: (mistralResult.confidence + llama2Result.confidence + nlpResult.confidence) / 3,
                    },
                };
            });
        });
        const results = await Promise.all(processingTasks);
        results.forEach((result) => this.results.set(result.id, { success: true, data: result, error: null }));
        return results.map((result) => ({ success: true, data: result, error: null }));
    }
    aggregateTopics(topics) {
        const topicMap = new Map();
        topics.forEach((topic) => {
            const existing = topicMap.get(topic.name);
            if (existing) {
                existing.confidence += topic.confidence;
                topic.keywords.forEach((k) => existing.keywords.add(k));
                existing.count++;
            }
            else {
                topicMap.set(topic.name, {
                    confidence: topic.confidence,
                    keywords: new Set(topic.keywords),
                    count: 1,
                });
            }
        });
        return Array.from(topicMap.entries()).map(([name, data]) => ({
            name,
            confidence: data.confidence / data.count,
            keywords: Array.from(data.keywords),
        }));
    }
    aggregateFeatures(featuresList) {
        const result = {};
        featuresList.forEach((features) => {
            Object.entries(features).forEach(([category, categoryFeatures]) => {
                if (!result[category]) {
                    result[category] = new Map();
                }
                categoryFeatures.forEach((feature) => {
                    const existing = result[category].get(feature.name);
                    if (existing) {
                        existing.sentiment += feature.sentiment;
                        existing.confidence += feature.confidence;
                        existing.mentions += feature.mentions;
                        feature.context.forEach((c) => existing.context.add(c));
                        existing.count++;
                    }
                    else {
                        result[category].set(feature.name, {
                            sentiment: feature.sentiment,
                            confidence: feature.confidence,
                            mentions: feature.mentions,
                            context: new Set(feature.context),
                            count: 1,
                        });
                    }
                });
            });
        });
        return Object.fromEntries(Object.entries(result).map(([category, features]) => [
            category,
            Array.from(features.entries()).map(([name, data]) => ({
                name,
                sentiment: data.sentiment / data.count,
                confidence: data.confidence / data.count,
                mentions: data.mentions,
                context: Array.from(data.context),
            })),
        ]));
    }
    async queryMistral(signal) {
        return new Promise((resolve, reject) => {
            const process = (0, child_process_1.spawn)('ollama', [
                'run',
                'mistral',
                JSON.stringify({
                    type: 'analyze',
                    content: signal.content,
                    context: signal.context,
                }),
            ]);
            let output = '';
            process.stdout.on('data', (data) => {
                output += data.toString();
            });
            process.on('close', (code) => {
                if (code === 0) {
                    try {
                        resolve(JSON.parse(output));
                    }
                    catch (error) {
                        reject(new Error(`Failed to parse Mistral output: ${error}`));
                    }
                }
                else {
                    reject(new Error(`Mistral process exited with code ${code}`));
                }
            });
        });
    }
    async queryLlama2(signal) {
        return new Promise((resolve, reject) => {
            const process = (0, child_process_1.spawn)('ollama', [
                'run',
                'llama2',
                JSON.stringify({
                    type: 'analyze',
                    content: signal.content,
                    context: signal.context,
                }),
            ]);
            let output = '';
            process.stdout.on('data', (data) => {
                output += data.toString();
            });
            process.on('close', (code) => {
                if (code === 0) {
                    try {
                        resolve(JSON.parse(output));
                    }
                    catch (error) {
                        reject(new Error(`Failed to parse Llama2 output: ${error}`));
                    }
                }
                else {
                    reject(new Error(`Llama2 process exited with code ${code}`));
                }
            });
        });
    }
    async processNLP(signal) {
        // Basic NLP processing implementation
        const words = signal.content.toLowerCase().split(/\W+/);
        const sentiment = this.calculateSentiment(words);
        const topics = this.extractTopics(words);
        return {
            sentiment,
            topics: topics.map((topic) => ({
                name: topic,
                confidence: 0.8,
                keywords: [topic],
            })),
            features: {},
            confidence: 0.7,
            relatedSignals: [],
            crossReferences: [],
        };
    }
    calculateSentiment(words) {
        // Very basic sentiment analysis
        const positiveWords = new Set([
            'good',
            'great',
            'excellent',
            'amazing',
            'wonderful',
            'fantastic',
        ]);
        const negativeWords = new Set([
            'bad',
            'poor',
            'terrible',
            'awful',
            'horrible',
            'disappointing',
        ]);
        let score = 0;
        words.forEach((word) => {
            if (positiveWords.has(word))
                score += 1;
            if (negativeWords.has(word))
                score -= 1;
        });
        return Math.tanh(score / 5); // Normalize to [-1, 1]
    }
    extractTopics(words) {
        // Simple frequency-based topic extraction
        const wordFreq = new Map();
        words.forEach((word) => {
            if (word.length > 3) {
                // Skip short words
                wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
            }
        });
        return Array.from(wordFreq.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([word]) => word);
    }
    getResult(taskId) {
        return this.results.get(taskId);
    }
    clearResults() {
        this.results.clear();
    }
    getMetrics() {
        return { ...this.metrics };
    }
    getActiveProcesses() {
        return this.activeTasks.size;
    }
}
exports.ParallelProcessor = ParallelProcessor;
//# sourceMappingURL=parallelProcessor.js.map