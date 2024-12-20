import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, filter, debounceTime } from 'rxjs/operators';
import { DemandPattern } from '../types/demandPattern';
import { AwinProduct, AwinSearchParams } from '../types/awinTypes';
import { logger } from '../utils/logger';
import { performanceMonitor } from '../utils/performance';
import { ResonanceError } from '../types/errors';
import { IntelligenceEnhancer } from './intelligenceEnhancer';

interface ResonanceVector {
    dimension: string;
    magnitude: number;
    direction: number;
}

interface DemandConfidence {
    primarySignals: {
        passiveEngagement: number;    // Natural interest indicators
        contentExpertise: number;     // Domain knowledge
        purchaseReadiness: number;    // Likelihood to act
        valueAlignment: number;       // Match with offering
    };
    contextualFactors: {
        marketTiming: number;         // Right time for purchase
        competitivePosition: number;  // Better than alternatives
        needUrgency: number;         // How pressing is the need
    };
    confidenceScore: number;         // Aggregate confidence
}

interface ResonanceState {
    vectors: ResonanceVector[];
    coherence: number;
    intensity: number;
    demandConfidence?: DemandConfidence;
    error?: ResonanceError;
}

interface SignalDimension {
    type: string;
    strength: number;
}

interface AttentionQuality {
    depth: {
        timeInvested: number;      // Time spent reading/writing
        wordCount: number;         // Length of contribution
        uniqueWords: number;       // Vocabulary diversity
        followUpRate: number;      // Returns to discussion
    };
    complexity: {
        questionCount: number;     // Asks meaningful questions
        comparisonCount: number;   // Makes thoughtful comparisons
        referenceCount: number;    // Cites sources/experiences
        counterpoints: number;     // Considers alternatives
    };
    authenticity: {
        personalExperience: number;  // Shares real experiences
        detailLevel: number;         // Specific vs generic
        emotionalInvestment: number; // Personal stake
        consistencyScore: number;    // Pattern consistency
    };
    interaction: {
        responseQuality: number;     // Thoughtful responses
        discussionBranching: number; // Creates new threads
        communityEngagement: number; // Helps others
        valueAddition: number;       // Contributes new info
    };
}

export class ResonanceField {
    private supplyField = new BehaviorSubject<ResonanceState>({ vectors: [], coherence: 0, intensity: 0 });
    private demandField = new BehaviorSubject<ResonanceState>({ vectors: [], coherence: 0, intensity: 0 });
    private intelligenceEnhancer = new IntelligenceEnhancer();

    // Observable that emits when resonance occurs between supply and demand
    resonance$ = combineLatest([this.supplyField, this.demandField]).pipe(
        map(([supply, demand]) => this.calculateResonance(supply, demand)),
        filter(resonance => resonance.intensity > 0),
        debounceTime(100)
    );

    private calculateResonance(supply: ResonanceState, demand: ResonanceState): ResonanceState {
        return performanceMonitor.measure('calculateResonance', () => {
            try {
                logger.debug('Calculating resonance between supply and demand vectors', {
                    supplyVectors: supply.vectors.length,
                    demandVectors: demand.vectors.length
                });
                
                if (!supply.vectors.length || !demand.vectors.length) {
                    throw new ResonanceError('Empty vector fields detected');
                }

                const coherence = performanceMonitor.measure('calculateCoherence', 
                    () => this.calculateCoherence(supply.vectors, demand.vectors),
                    { vectorCount: supply.vectors.length + demand.vectors.length }
                );
                
                const intensity = performanceMonitor.measure('calculateIntensity',
                    () => this.calculateIntensity(supply.vectors, demand.vectors),
                    { vectorCount: supply.vectors.length + demand.vectors.length }
                );
                
                const demandConfidence = this.calculateDemandConfidence(demand.vectors, demand);
                
                logger.info('Resonance calculation completed', {
                    coherence,
                    intensity,
                    totalVectors: supply.vectors.length + demand.vectors.length
                });
                
                return {
                    vectors: [...supply.vectors, ...demand.vectors],
                    coherence,
                    intensity,
                    demandConfidence
                };
            } catch (error) {
                logger.error('Error calculating resonance', {
                    error: error instanceof Error ? error.message : 'Unknown error',
                    supply: supply.vectors.length,
                    demand: demand.vectors.length
                });
                return {
                    vectors: [],
                    coherence: 0,
                    intensity: 0,
                    error: error instanceof ResonanceError ? error : new ResonanceError('Unknown resonance calculation error')
                };
            }
        }, {
            supplyVectorCount: supply.vectors.length,
            demandVectorCount: demand.vectors.length
        });
    }

    private calculateDemandConfidence(
        signals: SignalDimension[],
        pattern: DemandPattern
    ): DemandConfidence {
        // Calculate primary signals
        const passiveEngagement = this.evaluatePassiveEngagement(signals);
        const contentExpertise = this.evaluateContentExpertise(signals);
        const purchaseReadiness = this.evaluatePurchaseReadiness(signals, pattern);
        const valueAlignment = this.evaluateValueAlignment(signals, pattern);

        // Calculate contextual factors
        const marketTiming = this.evaluateMarketTiming(signals);
        const competitivePosition = this.evaluateCompetitivePosition(pattern);
        const needUrgency = this.evaluateNeedUrgency(signals);

        // Aggregate confidence score
        const confidenceScore = this.aggregateConfidence({
            passiveEngagement,
            contentExpertise,
            purchaseReadiness,
            valueAlignment,
            marketTiming,
            competitivePosition,
            needUrgency
        });

        return {
            primarySignals: {
                passiveEngagement,
                contentExpertise,
                purchaseReadiness,
                valueAlignment
            },
            contextualFactors: {
                marketTiming,
                competitivePosition,
                needUrgency
            },
            confidenceScore
        };
    }

    private evaluatePassiveEngagement(signals: SignalDimension[]): number {
        return signals.reduce((score, signal) => {
            // Weight factors that indicate genuine interest
            const weights = {
                article_read: 0.4,    // Reading in-depth content
                content_share: 0.3,   // Sharing with network
                return_visit: 0.2,    // Coming back to topic
                dwell_time: 0.1      // Time spent engaging
            };

            return score + (weights[signal.type] || 0) * signal.strength;
        }, 0);
    }

    private evaluateContentExpertise(signals: SignalDimension[]): number {
        // Measure depth of domain knowledge
        return signals.reduce((expertise, signal) => {
            const knowledgeIndicators = {
                technical_terms_used: 0.3,
                comparison_made: 0.3,
                question_quality: 0.2,
                discussion_depth: 0.2
            };

            // Analyze signal context for expertise markers
            return expertise + this.analyzeExpertiseMarkers(signal);
        }, 0);
    }

    private evaluatePurchaseReadiness(
        signals: SignalDimension[],
        pattern: DemandPattern
    ): number {
        // Combine multiple readiness indicators
        const priceConsideration = this.analyzePriceSignals(signals);
        const alternativeEvaluation = this.analyzeAlternatives(signals);
        const decisionProgress = this.analyzeDecisionStage(signals);

        return (priceConsideration + alternativeEvaluation + decisionProgress) / 3;
    }

    private evaluateValueAlignment(
        signals: SignalDimension[],
        pattern: DemandPattern
    ): number {
        // Match value signals with pattern
        return this.calculateValueMatch(signals, pattern);
    }

    private evaluateMarketTiming(signals: SignalDimension[]): number {
        // Calculate market timing factor
        return 0.5; // placeholder
    }

    private evaluateCompetitivePosition(pattern: DemandPattern): number {
        // Calculate competitive position factor
        return 0.5; // placeholder
    }

    private evaluateNeedUrgency(signals: SignalDimension[]): number {
        // Calculate need urgency factor
        return 0.5; // placeholder
    }

    private aggregateConfidence(confidenceFactors: {
        passiveEngagement: number;
        contentExpertise: number;
        purchaseReadiness: number;
        valueAlignment: number;
        marketTiming: number;
        competitivePosition: number;
        needUrgency: number;
    }): number {
        // Aggregate confidence score
        return (confidenceFactors.passiveEngagement +
            confidenceFactors.contentExpertise +
            confidenceFactors.purchaseReadiness +
            confidenceFactors.valueAlignment +
            confidenceFactors.marketTiming +
            confidenceFactors.competitivePosition +
            confidenceFactors.needUrgency) / 7;
    }

    private analyzeExpertiseMarkers(signal: SignalDimension): number {
        // Analyze signal context for expertise markers
        return 0.5; // placeholder
    }

    private analyzePriceSignals(signals: SignalDimension[]): number {
        // Analyze price signals
        return 0.5; // placeholder
    }

    private analyzeAlternatives(signals: SignalDimension[]): number {
        // Analyze alternative evaluation signals
        return 0.5; // placeholder
    }

    private analyzeDecisionStage(signals: SignalDimension[]): number {
        // Analyze decision stage signals
        return 0.5; // placeholder
    }

    private calculateValueMatch(signals: SignalDimension[], pattern: DemandPattern): number {
        // Match value signals with pattern
        return 0.5; // placeholder
    }

    private calculateCoherence(supplyVectors: ResonanceVector[], demandVectors: ResonanceVector[]): number {
        // Example logic: calculate average alignment
        let totalAlignment = 0;
        let count = 0;

        supplyVectors.forEach(supplyVector => {
            demandVectors.forEach(demandVector => {
                if (supplyVector.dimension === demandVector.dimension) {
                    totalAlignment += 1 - Math.abs(supplyVector.direction - demandVector.direction);
                    count++;
                }
            });
        });

        return count > 0 ? totalAlignment / count : 0;
    }

    private calculateIntensity(supplyVectors: ResonanceVector[], demandVectors: ResonanceVector[]): number {
        return performanceMonitor.measure('calculateIntensity', () => {
            // Calculate normalized intensity based on vector magnitudes
            const supplyMagnitude = supplyVectors.reduce((sum, v) => sum + v.magnitude, 0) / supplyVectors.length;
            const demandMagnitude = demandVectors.reduce((sum, v) => sum + v.magnitude, 0) / demandVectors.length;
            
            // Normalize the combined magnitude to be between 0 and 1
            // Using a more conservative normalization approach
            return Math.min(0.99, (supplyMagnitude * demandMagnitude));
        }, {
            supplyCount: supplyVectors.length,
            demandCount: demandVectors.length
        });
    }

    private calculateAttentionQuality(signals: SignalDimension[]): AttentionQuality {
        return {
            depth: this.measureDepth(signals),
            complexity: this.measureComplexity(signals),
            authenticity: this.measureAuthenticity(signals),
            interaction: this.measureInteraction(signals)
        };
    }

    private measureDepth(signals: SignalDimension[]): AttentionQuality['depth'] {
        const timePatterns = signals.filter(s => s.type === 'temporal');
        const contentSignals = signals.filter(s => s.type === 'content');
        
        return {
            timeInvested: this.calculateTimeInvestment(timePatterns),
            wordCount: this.getAverageWordCount(contentSignals),
            uniqueWords: this.countUniqueWords(contentSignals),
            followUpRate: this.calculateFollowUpRate(signals)
        };
    }

    private measureComplexity(signals: SignalDimension[]): AttentionQuality['complexity'] {
        const content = signals.filter(s => s.type === 'content').map(s => s.content).join(' ');
        
        return {
            questionCount: (content.match(/\?/g) || []).length,
            comparisonCount: this.countComparisons(content),
            referenceCount: this.countReferences(content),
            counterpoints: this.identifyCounterpoints(content)
        };
    }

    private measureAuthenticity(signals: SignalDimension[]): AttentionQuality['authenticity'] {
        return {
            personalExperience: this.detectPersonalExperience(signals),
            detailLevel: this.assessDetailLevel(signals),
            emotionalInvestment: this.measureEmotionalInvestment(signals),
            consistencyScore: this.evaluateConsistency(signals)
        };
    }

    private measureInteraction(signals: SignalDimension[]): AttentionQuality['interaction'] {
        const interactions = signals.filter(s => s.type === 'interaction');
        
        return {
            responseQuality: this.evaluateResponseQuality(interactions),
            discussionBranching: this.measureDiscussionBranching(interactions),
            communityEngagement: this.assessCommunityEngagement(interactions),
            valueAddition: this.measureValueAddition(interactions)
        };
    }

    async enhanceSearchParams(input: {
        baseParams: AwinSearchParams,
        context: any
    }): Promise<AwinSearchParams> {
        const { baseParams, context } = input;
        
        // Enhance keywords based on context
        let enhancedKeywords = baseParams.keyword?.split(' ') || [];
        
        // Add seasonal context
        if (context.season === 'winter') {
            enhancedKeywords = enhancedKeywords.concat(['indoor', 'winter']);
        }

        // Add location-specific terms
        if (context.location?.region) {
            // Could add region-specific terms here
        }

        return {
            ...baseParams,
            keyword: enhancedKeywords.join(' ') || ''  // Ensure we always return a string
        };
    }

    async scoreProducts(products: AwinProduct[], pattern: DemandPattern): Promise<AwinProduct[]> {
        return products.map(product => ({
            ...product,
            resonanceScore: await this.calculateProductResonance(product, pattern)
        }));
    }

    private async calculateProductResonance(product: AwinProduct, pattern: DemandPattern): Promise<number> {
        try {
            // Get traditional vector-based resonance
            const vectors = await this.productToVectors(product);
            const vectorScore = this.calculateVectorResonance(vectors, pattern);

            // Get AI-enhanced contextual resonance
            const contextualScore = await this.intelligenceEnhancer.calculateContextualResonance(product, pattern);

            // Combine scores (weighted average)
            return (vectorScore * 0.6) + (contextualScore * 0.4);
        } catch (error) {
            logger.error('Error calculating product resonance:', error);
            return this.calculateVectorResonance(await this.productToVectors(product), pattern);
        }
    }

    private calculateVectorResonance(vectors: ResonanceVector[], pattern: DemandPattern): number {
        // Original vector-based calculation
        const coherence = this.calculateCoherence(vectors, []);
        const intensity = this.calculateIntensity(vectors, []);
        return (coherence + intensity) / 2;
    }

    private async productToVectors(product: AwinProduct): Promise<ResonanceVector[]> {
        return [
            // Price vector: normalized to market range
            {
                dimension: 'price',
                magnitude: this.normalizePriceToMarket(product.price),
                direction: this.calculatePriceDirection(product.price)
            },
            // Popularity vector: based on merchant rating and product reviews
            {
                dimension: 'popularity',
                magnitude: this.calculatePopularityMagnitude(product),
                direction: 1.0  // Always positive
            },
            // Availability vector
            {
                dimension: 'availability',
                magnitude: 1.0,  // In stock = 1.0, Out of stock = 0.0
                direction: 1.0
            },
            // Category relevance
            {
                dimension: 'category',
                magnitude: this.calculateCategoryRelevance(product.categories),
                direction: 1.0
            }
        ];
    }

    private normalizePriceToMarket(price: number): number {
        // TODO: Implement market price range analysis
        return Math.min(1.0, price / 1000);  // Simple normalization for now
    }

    private calculatePriceDirection(price: number): number {
        // Lower prices get higher direction values
        return 1.0 - this.normalizePriceToMarket(price);
    }

    private calculatePopularityMagnitude(product: AwinProduct): number {
        // TODO: Implement real popularity metrics
        return 0.8;  // Placeholder
    }

    private calculateCategoryRelevance(categories: string[]): number {
        // TODO: Implement category matching logic
        return categories.length > 0 ? 1.0 : 0.0;
    }
}

export class ResonanceFieldService {
    async enhanceSearchParams(input: {
        baseParams: AwinSearchParams,
        context: any
    }): Promise<AwinSearchParams> {
        const { baseParams, context } = input;
        
        // Enhance keywords based on context
        let enhancedKeywords = baseParams.keyword?.split(' ') || [];
        
        // Add seasonal context
        if (context.season === 'winter') {
            enhancedKeywords = enhancedKeywords.concat(['indoor', 'winter']);
        }

        // Add location-specific terms
        if (context.location?.region) {
            // Could add region-specific terms here
        }

        return {
            ...baseParams,
            keyword: enhancedKeywords.join(' ')
        };
    }

    async scoreProducts(products: AwinProduct[], pattern: DemandPattern): Promise<AwinProduct[]> {
        return products.map(product => ({
            ...product,
            resonanceScore: this.calculateResonance(product, pattern)
        }));
    }

    private calculateResonance(product: AwinProduct, pattern: DemandPattern): number {
        let score = 0;

        // Basic keyword matching
        const keywords = pattern.keywords || [];
        const productText = `${product.title} ${product.description}`.toLowerCase();
        score += keywords.filter(kw => productText.includes(kw.toLowerCase())).length;

        // Context matching
        if (pattern.context?.preferences) {
            score += pattern.context.preferences
                .filter(pref => productText.includes(pref.toLowerCase()))
                .length * 1.5;
        }

        // Sustainability bonus
        if (pattern.resonanceFactors?.sustainability && 
            (productText.includes('sustainable') || productText.includes('eco') || productText.includes('organic'))) {
            score += pattern.resonanceFactors.sustainability / 2;
        }

        // Normalize score to 0-10 range
        return Math.min(10, score);
    }
}
