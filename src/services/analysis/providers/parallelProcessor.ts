import { EventEmitter } from 'events';
import { spawn } from 'child_process';
import { DemandSignal, ProcessedSignal, ProcessResult } from '../../../types/demandTypes';
import { ProcessorConfig, ProcessorMetrics } from '../../../types/processingTypes';

interface ProcessingTask {
  id: string;
  signal: DemandSignal;
  timestamp: string;
}

export class ParallelProcessor extends EventEmitter {
  private activeTasks: Map<string, Promise<any>> = new Map();
  private results: Map<string, ProcessResult<ProcessedSignal>> = new Map();
  private config: ProcessorConfig;
  private metrics: ProcessorMetrics;

  constructor(config: ProcessorConfig) {
    super();
    this.config = config;
    this.metrics = {
      processedCount: 0,
      errorCount: 0,
      avgProcessingTime: 0
    };
  }

  async processInParallel(tasks: ProcessingTask[]): Promise<ProcessResult<ProcessedSignal>[]> {
    const processingTasks = tasks.map((task) => {
      const mistralPromise = this.queryMistral(task.signal);
      const llama2Promise = this.queryLlama2(task.signal);
      const nlpPromise = this.processNLP(task.signal);

      const startTime = Date.now();

      return Promise.all([mistralPromise, llama2Promise, nlpPromise]).then(
        ([mistralResult, llama2Result, nlpResult]) => {
          const processingTime = Date.now() - startTime;

          return {
            id: task.id,
            signal: task.signal,
            timestamp: task.timestamp,
            analysis: {
              sentiment:
                (mistralResult.sentiment + llama2Result.sentiment + nlpResult.sentiment) / 3,
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
                relatedSignals: Array.from(
                  new Set([
                    ...(mistralResult.relatedSignals || []),
                    ...(llama2Result.relatedSignals || []),
                  ])
                ),
                crossReferences: Array.from(
                  new Set([
                    ...(mistralResult.crossReferences || []),
                    ...(llama2Result.crossReferences || []),
                  ])
                ),
              },
            },
            metadata: {
              processingTime,
              provider: 'LocalIntelligence',
              confidence:
                (mistralResult.confidence + llama2Result.confidence + nlpResult.confidence) / 3,
            },
          } as ProcessedSignal;
        }
      );
    });

    const results = await Promise.all(processingTasks);
    results.forEach((result) => this.results.set(result.id, { success: true, data: result, error: null }));
    return results.map((result) => ({ success: true, data: result, error: null }));
  }

  private aggregateTopics(
    topics: Array<{ name: string; confidence: number; keywords: string[] }>
  ): Array<{ name: string; confidence: number; keywords: string[] }> {
    const topicMap = new Map<
      string,
      { confidence: number; keywords: Set<string>; count: number }
    >();

    topics.forEach((topic) => {
      const existing = topicMap.get(topic.name);
      if (existing) {
        existing.confidence += topic.confidence;
        topic.keywords.forEach((k) => existing.keywords.add(k));
        existing.count++;
      } else {
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

  private aggregateFeatures(
    featuresList: Array<{
      [category: string]: Array<{
        name: string;
        sentiment: number;
        confidence: number;
        mentions: number;
        context: string[];
      }>;
    }>
  ): {
    [category: string]: Array<{
      name: string;
      sentiment: number;
      confidence: number;
      mentions: number;
      context: string[];
    }>;
  } {
    const result: {
      [category: string]: Map<
        string,
        {
          sentiment: number;
          confidence: number;
          mentions: number;
          context: Set<string>;
          count: number;
        }
      >;
    } = {};

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
          } else {
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

    return Object.fromEntries(
      Object.entries(result).map(([category, features]) => [
        category,
        Array.from(features.entries()).map(([name, data]) => ({
          name,
          sentiment: data.sentiment / data.count,
          confidence: data.confidence / data.count,
          mentions: data.mentions,
          context: Array.from(data.context),
        })),
      ])
    );
  }

  private async queryMistral(signal: DemandSignal): Promise<any> {
    return new Promise((resolve, reject) => {
      const process = spawn('ollama', [
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
          } catch (error) {
            reject(new Error(`Failed to parse Mistral output: ${error}`));
          }
        } else {
          reject(new Error(`Mistral process exited with code ${code}`));
        }
      });
    });
  }

  private async queryLlama2(signal: DemandSignal): Promise<any> {
    return new Promise((resolve, reject) => {
      const process = spawn('ollama', [
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
          } catch (error) {
            reject(new Error(`Failed to parse Llama2 output: ${error}`));
          }
        } else {
          reject(new Error(`Llama2 process exited with code ${code}`));
        }
      });
    });
  }

  private async processNLP(signal: DemandSignal): Promise<any> {
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

  private calculateSentiment(words: string[]): number {
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
      if (positiveWords.has(word)) score += 1;
      if (negativeWords.has(word)) score -= 1;
    });

    return Math.tanh(score / 5); // Normalize to [-1, 1]
  }

  private extractTopics(words: string[]): string[] {
    // Simple frequency-based topic extraction
    const wordFreq = new Map<string, number>();
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

  getResult(taskId: string): ProcessResult<ProcessedSignal> | undefined {
    return this.results.get(taskId);
  }

  clearResults(): void {
    this.results.clear();
  }

  getMetrics(): ProcessorMetrics {
    return { ...this.metrics };
  }

  getActiveProcesses(): number {
    return this.activeTasks.size;
  }
}
