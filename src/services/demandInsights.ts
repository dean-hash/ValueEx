import { Observable, Subject, merge } from 'rxjs';
import { filter, map, groupBy } from 'rxjs/operators';

interface DemandSignal {
    source: 'email' | 'search' | 'social' | 'direct';
    intent: string;
    context: {
        urgency: number;  // 0-1
        specificity: number;  // 0-1
        valueConstraints?: {
            budget?: number;
            timeframe?: string;
        };
    };
    timestamp: Date;
    confidence: number;
}

interface SupplyMatch {
    demandSignal: DemandSignal;
    potentialSolutions: Array<{
        source: string;
        relevance: number;
        value: number;
        availability: boolean;
    }>;
}

export class DemandInsights {
    private emailSignals = new Subject<DemandSignal>();
    private publicSignals = new Subject<DemandSignal>();
    private directSignals = new Subject<DemandSignal>();
    
    private allSignals: Observable<DemandSignal>;
    private patterns = new Map<string, Array<DemandSignal>>();

    constructor() {
        // Merge all signal sources
        this.allSignals = merge(
            this.emailSignals.pipe(
                map(signal => ({
                    ...signal,
                    confidence: signal.context.specificity * 1.5 // Email intentions tend to be more explicit
                }))
            ),
            this.publicSignals,
            this.directSignals
        );

        // Setup pattern recognition
        this.initializePatternRecognition();
    }

    private initializePatternRecognition() {
        this.allSignals.pipe(
            groupBy(signal => this.categorizeIntent(signal.intent))
        ).subscribe(group => {
            group.subscribe(signal => {
                this.updatePatterns(group.key, signal);
            });
        });
    }

    private categorizeIntent(intent: string): string {
        // Group similar intents together
        // Example: "need laptop for work" and "looking for business computer" -> "business_computing"
        return intent.toLowerCase()
            .replace(/\b(need|looking|want|require)\b/g, '')
            .trim()
            .replace(/\s+/g, '_');
    }

    private updatePatterns(category: string, signal: DemandSignal) {
        const existing = this.patterns.get(category) || [];
        existing.push(signal);
        
        // Keep only recent signals (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const filtered = existing.filter(s => s.timestamp > thirtyDaysAgo);
        this.patterns.set(category, filtered);
    }

    public async processEmailInsight(
        intent: string,
        context: any,
        preservePrivacy: boolean = true
    ) {
        if (preservePrivacy) {
            // Remove any PII or sensitive details
            intent = this.sanitizeIntent(intent);
            context = this.sanitizeContext(context);
        }

        this.emailSignals.next({
            source: 'email',
            intent,
            context: {
                urgency: this.calculateUrgency(context),
                specificity: this.calculateSpecificity(intent),
                valueConstraints: this.extractValueConstraints(context)
            },
            timestamp: new Date(),
            confidence: 0.8 // Base confidence for explicit email signals
        });
    }

    private sanitizeIntent(intent: string): string {
        // Remove names, emails, phone numbers, etc.
        return intent.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
                    .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]')
                    .replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, '[NAME]');
    }

    private sanitizeContext(context: any): any {
        // Deep clone and sanitize context object
        const sanitized = JSON.parse(JSON.stringify(context));
        this.recursiveSanitize(sanitized);
        return sanitized;
    }

    private recursiveSanitize(obj: any) {
        for (let key in obj) {
            if (typeof obj[key] === 'string') {
                obj[key] = this.sanitizeIntent(obj[key]);
            } else if (typeof obj[key] === 'object') {
                this.recursiveSanitize(obj[key]);
            }
        }
    }

    public getEmergingPatterns(): Map<string, {
        frequency: number,
        avgUrgency: number,
        avgSpecificity: number,
        commonConstraints: any
    }> {
        const patterns = new Map();

        for (let [category, signals] of this.patterns) {
            patterns.set(category, {
                frequency: signals.length,
                avgUrgency: this.average(signals.map(s => s.context.urgency)),
                avgSpecificity: this.average(signals.map(s => s.context.specificity)),
                commonConstraints: this.aggregateConstraints(signals)
            });
        }

        return patterns;
    }

    private average(numbers: number[]): number {
        return numbers.reduce((a, b) => a + b, 0) / numbers.length;
    }

    private aggregateConstraints(signals: DemandSignal[]): any {
        const constraints = signals
            .map(s => s.context.valueConstraints)
            .filter(c => c);

        if (constraints.length === 0) return {};

        return {
            budget: {
                min: Math.min(...constraints.map(c => c?.budget || Infinity).filter(b => b !== Infinity)),
                max: Math.max(...constraints.map(c => c?.budget || 0)),
                avg: this.average(constraints.map(c => c?.budget || 0).filter(b => b > 0))
            },
            timeframe: this.findMostCommon(constraints.map(c => c?.timeframe).filter(t => t))
        };
    }

    private findMostCommon(arr: any[]): any {
        if (arr.length === 0) return null;
        
        const frequency = arr.reduce((acc, val) => {
            acc[val] = (acc[val] || 0) + 1;
            return acc;
        }, {});

        return Object.entries(frequency)
            .reduce((a, b) => a[1] > b[1] ? a : b)[0];
    }

    private calculateUrgency(context: any): number {
        // Implement urgency calculation based on:
        // - Time-related keywords
        // - Repetition of request
        // - Expression intensity
        return 0.5; // Placeholder
    }

    private calculateSpecificity(intent: string): number {
        // Implement specificity calculation based on:
        // - Detail level
        // - Concrete requirements
        // - Quantifiable elements
        return 0.7; // Placeholder
    }

    private extractValueConstraints(context: any): any {
        // Extract budget, timeframe, and other constraints
        return {}; // Placeholder
    }
}
