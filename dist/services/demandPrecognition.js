"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DemandPrecognition = void 0;
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
class DemandPrecognition {
    constructor() {
        this.signalStreams = new Map();
        this.patterns = new rxjs_1.BehaviorSubject([]);
        this.valuePatterns = new rxjs_1.BehaviorSubject([]);
        this.historicalAccuracy = new Map();
        this.vectorResonance = new Map();
        this.networkEffects = new rxjs_1.BehaviorSubject([]);
        this.signalSources = new Map([
            [
                'google_trends',
                {
                    type: 'search',
                    provider: 'Google',
                    endpoint: 'https://trends.google.com/trends/api/dailytrends',
                    rateLimit: {
                        requests: 1000,
                        period: 'day',
                    },
                },
            ],
            [
                'twitter_stream',
                {
                    type: 'social',
                    provider: 'Twitter',
                    endpoint: 'https://api.twitter.com/2/tweets/search/stream',
                    rateLimit: {
                        requests: 500000,
                        period: 'month',
                    },
                    authentication: {
                        type: 'bearer',
                    },
                },
            ],
            [
                'reddit_stream',
                {
                    type: 'social',
                    provider: 'Reddit',
                    endpoint: 'https://oauth.reddit.com/r/subreddit/new',
                    rateLimit: {
                        requests: 100,
                        period: 'minute',
                    },
                    authentication: {
                        type: 'oauth',
                    },
                },
            ],
            [
                'news_api',
                {
                    type: 'news',
                    provider: 'NewsAPI',
                    endpoint: 'https://newsapi.org/v2/everything',
                    rateLimit: {
                        requests: 100,
                        period: 'day',
                    },
                    authentication: {
                        type: 'apikey',
                    },
                },
            ],
        ]);
        this.initializeSignalStreams();
        this.startPatternRecognition();
    }
    initializeSignalStreams() {
        // Initialize different signal types
        ['behavior', 'conversation', 'search', 'event', 'social', 'economic'].forEach((type) => {
            this.signalStreams.set(type, new rxjs_1.BehaviorSubject([]));
        });
    }
    startPatternRecognition() {
        // Combine all signal streams
        const allStreams = Array.from(this.signalStreams.values());
        (0, rxjs_1.combineLatest)(allStreams)
            .pipe((0, operators_1.debounceTime)(100), // Allow signals to stabilize
        (0, operators_1.map)((signalArrays) => this.recognizePatterns(signalArrays.flat())))
            .subscribe((patterns) => {
            this.patterns.next(patterns);
            this.updateHistoricalAccuracy(patterns);
            this.identifyValueCreationOpportunities(signalArrays.flat());
        });
    }
    addSignal(signal) {
        const stream = this.signalStreams.get(signal.type);
        if (stream) {
            const current = stream.value;
            const updated = this.integrateNewSignal(current, signal);
            stream.next(updated);
        }
    }
    integrateNewSignal(existing, newSignal) {
        // Find related signals
        const related = existing.filter((s) => this.areSignalsRelated(s, newSignal));
        if (related.length === 0) {
            return [...existing, newSignal];
        }
        // Update related signals' momentum
        const updatedRelated = related.map((s) => ({
            ...s,
            velocity: (s.velocity + newSignal.velocity) / 2,
            acceleration: (s.acceleration + newSignal.acceleration) / 2,
            strength: (s.strength + newSignal.strength) / 2,
        }));
        // Replace old related signals with updated ones
        return [...existing.filter((s) => !related.includes(s)), ...updatedRelated];
    }
    areSignalsRelated(s1, s2) {
        // Implement signal relationship detection
        // This could look at context overlap, temporal proximity, etc.
        return false; // Placeholder
    }
    recognizePatterns(signals) {
        const patterns = [];
        // Group related signals
        const signalGroups = this.groupRelatedSignals(signals);
        for (const group of signalGroups) {
            const coherence = this.calculateCoherence(group);
            if (coherence > 0.7) {
                // Minimum coherence threshold
                patterns.push({
                    signals: group,
                    coherence,
                    momentum: this.calculateMomentum(group),
                    confidence: this.calculateConfidence(group),
                    timeHorizon: this.predictTimeHorizon(group),
                });
            }
        }
        return patterns;
    }
    groupRelatedSignals(signals) {
        const groups = [];
        const used = new Set();
        for (const signal of signals) {
            if (used.has(signal))
                continue;
            const group = [signal];
            used.add(signal);
            // Find related signals
            for (const other of signals) {
                if (!used.has(other) && this.areSignalsRelated(signal, other)) {
                    group.push(other);
                    used.add(other);
                }
            }
            groups.push(group);
        }
        return groups;
    }
    calculateCoherence(signals) {
        if (signals.length < 2)
            return 1;
        let coherenceSum = 0;
        let comparisons = 0;
        for (let i = 0; i < signals.length; i++) {
            for (let j = i + 1; j < signals.length; j++) {
                coherenceSum += this.calculateSignalCoherence(signals[i], signals[j]);
                comparisons++;
            }
        }
        return coherenceSum / comparisons;
    }
    calculateSignalCoherence(s1, s2) {
        // Calculate how well two signals align
        const velocityAlignment = 1 -
            Math.abs(s1.velocity - s2.velocity) / Math.max(Math.abs(s1.velocity), Math.abs(s2.velocity));
        const strengthAlignment = 1 - Math.abs(s1.strength - s2.strength);
        const accelerationAlignment = 1 -
            Math.abs(s1.acceleration - s2.acceleration) /
                Math.max(Math.abs(s1.acceleration), Math.abs(s2.acceleration));
        return (velocityAlignment + strengthAlignment + accelerationAlignment) / 3;
    }
    calculateMomentum(signals) {
        return (signals.reduce((sum, signal) => sum + signal.velocity * signal.strength * (1 + signal.acceleration), 0) / signals.length);
    }
    calculateConfidence(signals) {
        // Base confidence on:
        // 1. Historical accuracy of similar patterns
        // 2. Number of confirming signals
        // 3. Signal strength and coherence
        return 0.8; // Placeholder
    }
    predictTimeHorizon(signals) {
        const momentum = this.calculateMomentum(signals);
        const acceleration = signals.reduce((sum, s) => sum + s.acceleration, 0) / signals.length;
        return {
            emerging: this.calculateEmergingTime(momentum, acceleration),
            peak: this.calculatePeakTime(momentum, acceleration),
            duration: this.calculateDuration(momentum, acceleration),
        };
    }
    calculateEmergingTime(momentum, acceleration) {
        // Calculate hours until pattern becomes significant
        return Math.max(1, 24 / (momentum * (1 + acceleration)));
    }
    calculatePeakTime(momentum, acceleration) {
        // Calculate hours until pattern reaches peak
        return Math.max(2, 48 / (momentum * (1 + acceleration)));
    }
    calculateDuration(momentum, acceleration) {
        // Calculate expected duration in hours
        return Math.max(4, (72 * momentum) / (1 + Math.abs(acceleration)));
    }
    updateHistoricalAccuracy(patterns) {
        // Track how well our predictions match reality
        // This would be updated as patterns play out
    }
    async identifyValueCreationOpportunities(signals) {
        const patterns = [];
        for (const signal of signals) {
            const regulatoryContext = await this.analyzeRegulatoryLandscape(signal.context);
            const organizationalNeeds = this.extractOrganizationalNeeds(signal.context);
            const stakeholderImpact = this.mapStakeholderValue(signal.context.decisionDynamics);
            if (this.hasSignificantValuePotential(regulatoryContext, organizationalNeeds, stakeholderImpact)) {
                patterns.push({
                    directBenefits: this.quantifyDirectBenefits(organizationalNeeds),
                    indirectBenefits: this.identifyIndirectBenefits(stakeholderImpact),
                    regulatoryAlignment: regulatoryContext,
                    organizationalResonance: this.calculateOrganizationalFit(signal.context),
                });
            }
        }
        this.valuePatterns.next(patterns.filter((p) => this.isActionableValue(p)));
        await this.mapInfluenceVectors(signals[0].context);
    }
    async mapInfluenceVectors(context) {
        // Identify vectors that cross traditional boundaries
        const vectors = new Map();
        // Information flow vectors
        vectors.set('information', {
            type: 'information',
            channels: this.mapInformationChannels(context),
            crossovers: this.identifyCrossovers('information', context),
            culturalContext: this.extractCulturalContext(context),
        });
        // Process vectors
        vectors.set('process', {
            type: 'process',
            channels: this.mapProcessFlows(context),
            crossovers: this.identifyCrossovers('process', context),
            culturalContext: this.extractCulturalContext(context),
        });
        // Technology vectors
        vectors.set('technology', {
            type: 'technology',
            channels: this.mapTechnologyAdoption(context),
            crossovers: this.identifyCrossovers('technology', context),
            culturalContext: this.extractCulturalContext(context),
        });
        // Look for resonance between vectors
        this.analyzeVectorResonance(vectors);
        await this.analyzeNetworkPotential(vectors);
    }
    analyzeVectorResonance(vectors) {
        vectors.forEach((vector1, key1) => {
            vectors.forEach((vector2, key2) => {
                if (key1 !== key2) {
                    const resonancePoints = this.findResonancePoints(vector1, vector2);
                    // These points where vectors intersect often reveal
                    // hidden opportunities or challenges
                    resonancePoints.forEach((point) => {
                        this.updateValuePatterns(point);
                    });
                }
            });
        });
    }
    async analyzeNetworkPotential(vectors) {
        const effects = [];
        // Look for regulatory catalysts that could drive network formation
        const regulatoryCatalysts = this.identifyRegulatoryCatalysts(vectors);
        regulatoryCatalysts.forEach((catalyst) => {
            // Find technical capabilities that could address the catalyst
            const technicalCapabilities = this.mapTechnicalCapabilities(vectors);
            // Identify standardization opportunities
            const standardizationNeeds = this.findStandardizationNeeds(catalyst, technicalCapabilities);
            if (this.hasNetworkPotential(catalyst, standardizationNeeds)) {
                effects.push({
                    catalysts: {
                        regulatory: [catalyst.name],
                        technical: Array.from(technicalCapabilities.keys()),
                        market: this.identifyMarketDrivers(catalyst),
                    },
                    networkDynamics: this.calculateNetworkDynamics(standardizationNeeds, vectors),
                    standardization: {
                        current: this.mapCurrentImplementations(vectors),
                        gaps: this.identifyStandardizationGaps(standardizationNeeds),
                        opportunities: this.mapStandardizationOpportunities(standardizationNeeds, vectors),
                    },
                });
            }
        });
        this.networkEffects.next(effects);
    }
    hasNetworkPotential(catalyst, standardizationNeeds) {
        // Similar to Nyfix - look for:
        // 1. Regulatory/market pressure (like NYSE Rule 123)
        // 2. Technical fragmentation (like FIX variations)
        // 3. High connection costs (like managing multiple T1 lines)
        const regulatoryPressure = this.assessRegulatoryPressure(catalyst);
        const fragmentation = this.measureFragmentation(standardizationNeeds);
        const connectionCosts = this.assessConnectionCosts(standardizationNeeds);
        return regulatoryPressure > 0.7 && fragmentation > 0.6 && connectionCosts > 0.5;
    }
    calculateNetworkDynamics(standardizationNeeds, vectors) {
        // Calculate potential network value using Metcalfe's Law
        const potentialNodes = this.estimatePotentialNodes(vectors);
        const connectionValue = this.estimateConnectionValue(standardizationNeeds);
        return {
            currentNodes: this.countCurrentNodes(vectors),
            potentialNodes,
            connectionValue,
            networkValue: this.calculateMetcalfeValue(potentialNodes, connectionValue),
        };
    }
    mapStandardizationOpportunities(needs, vectors) {
        const opportunities = new Map();
        needs.forEach((need, key) => {
            const impact = this.assessStandardizationImpact(need, vectors);
            const effort = this.estimateImplementationEffort(need);
            const reach = this.calculatePotentialReach(need, vectors);
            if (impact / effort > 1.5) {
                // Threshold for good ROI
                opportunities.set(key, { impact, effort, reach });
            }
        });
        return opportunities;
    }
    findResonancePoints(v1, v2) {
        const points = [];
        // Look for shared channels
        v1.channels.forEach((channel1, key1) => {
            v2.channels.forEach((channel2, key2) => {
                if (this.channelsIntersect(channel1, channel2)) {
                    points.push({
                        type: 'channel_intersection',
                        strength: this.calculateResonanceStrength(channel1, channel2),
                        context: this.mergeContexts(v1.culturalContext, v2.culturalContext),
                    });
                }
            });
        });
        // Look for cultural alignments
        const culturalResonance = this.findCulturalResonance(v1.culturalContext, v2.culturalContext);
        if (culturalResonance.strength > 0.6) {
            points.push({
                type: 'cultural_resonance',
                strength: culturalResonance.strength,
                patterns: culturalResonance.patterns,
            });
        }
        return points;
    }
    updateValuePatterns(resonancePoint) {
        // When vectors intersect in interesting ways,
        // they often reveal opportunities that aren't
        // visible when looking at each vector in isolation
        const patterns = this.valuePatterns.value;
        const newPatterns = [...patterns];
        if (resonancePoint.strength > 0.8) {
            newPatterns.push({
                directBenefits: this.extractDirectBenefits(resonancePoint),
                indirectBenefits: this.extractIndirectBenefits(resonancePoint),
                regulatoryAlignment: this.checkRegulatoryImplications(resonancePoint),
                organizationalResonance: {
                    culturalFit: resonancePoint.culturalResonance || 0,
                    strategicAlignment: this.calculateStrategicFit(resonancePoint),
                    operationalSynergy: this.calculateOperationalFit(resonancePoint),
                },
            });
        }
        this.valuePatterns.next(newPatterns);
    }
    async analyzeRegulatoryLandscape(context) {
        // Look for regulatory requirements that could be addressed
        // Similar to how you found OSHA/HIPAA connections
        return {
            requirements: [],
            complianceGaps: [],
            riskMitigation: [],
        };
    }
    isActionableValue(pattern) {
        // Don't just look for "buyers" - look for where we can create real value
        const impactScore = Array.from(pattern.directBenefits.values()).reduce((sum, b) => sum + b.impact, 0);
        const alignmentScore = pattern.organizationalResonance.strategicAlignment;
        return impactScore > 0.7 && alignmentScore > 0.6;
    }
    async modelPerspective(context) {
        const perspectives = [];
        // For each stakeholder, imagine their world
        for (const [role, dynamics] of context.decisionDynamics.stakeholders) {
            const perspective = await this.synthesizePerspective(role, dynamics, context.environmentalFactors);
            // Look for non-obvious connections
            const hiddenOpportunities = this.discoverHiddenValue(perspective.challenges, context.environmentalFactors);
            perspective.opportunities.hidden = hiddenOpportunities;
            perspectives.push(perspective);
        }
        return this.crossReferencePerspectives(perspectives);
    }
    async synthesizePerspective(role, dynamics, factors) {
        // Put ourselves in their shoes
        return {
            role: {
                responsibilities: this.inferResponsibilities(role, factors),
                accountabilities: this.inferAccountabilities(role, factors),
                aspirations: this.inferAspirations(role, dynamics),
            },
            challenges: {
                known: this.identifyKnownChallenges(role, factors),
                potential: this.anticipatePotentialIssues(role, factors),
                future: this.projectFutureChallenges(role, factors),
            },
            opportunities: {
                immediate: new Map(),
                emerging: new Map(),
                hidden: new Map(),
            },
            motivations: {
                professional: this.inferProfessionalMotivations(role, dynamics),
                organizational: this.inferOrganizationalMotivations(factors),
                personal: this.inferPersonalMotivations(role, dynamics),
            },
        };
    }
    discoverHiddenValue(challenges, factors) {
        const hidden = new Map();
        // Look for regulatory implications
        // Like the OSHA/HIPAA connection
        this.findRegulatoryConnections(challenges, factors).forEach((value, key) => hidden.set(key, value));
        // Look for risk mitigation opportunities
        this.findRiskMitigationOpportunities(challenges, factors).forEach((value, key) => hidden.set(key, value));
        // Look for efficiency gains
        this.findEfficiencyOpportunities(challenges, factors).forEach((value, key) => hidden.set(key, value));
        return hidden;
    }
    crossReferencePerspectives(perspectives) {
        // Look for how one person's challenge might be
        // another's opportunity
        perspectives.forEach((p1) => {
            perspectives.forEach((p2) => {
                if (p1 !== p2) {
                    this.findInterconnectedValue(p1, p2);
                }
            });
        });
        return perspectives;
    }
    getEmergingPatterns() {
        return this.patterns.asObservable();
    }
    getValueCreationPatterns() {
        return this.valuePatterns.asObservable();
    }
    getNetworkEffects() {
        return this.networkEffects.asObservable();
    }
    getConfidenceMetrics() {
        return this.historicalAccuracy;
    }
    async aggregateSignals(context) {
        const scraper = new DemandSignalScraper();
        const enhancer = new IntelligenceEnhancer();
        const passiveAnalyzer = new PassiveEngagementAnalyzer();
        try {
            // Gather signals from multiple sources
            const [redditSignals, twitterSignals] = await Promise.all([
                scraper.scrapeRedditDemand('all', context.primaryDrivers.need),
                scraper.scrapeTwitterDemand(context.primaryDrivers.need),
            ]);
            const allSignals = [...redditSignals, ...twitterSignals];
            // Convert to engagement signals
            const engagementSignals = allSignals.map((signal) => ({
                type: this.determineEngagementType(signal),
                source: signal.type,
                duration: this.estimateEngagementDuration(signal),
                context: {
                    category: signal.context.primaryDrivers.need,
                    topic: this.extractTopics(signal),
                    sentiment: this.calculateSentiment(signal),
                },
            }));
            // Analyze passive engagement
            const engagementMetrics = await passiveAnalyzer.analyzeEngagement(engagementSignals);
            // Filter and weight signals based on genuine interest
            return allSignals
                .filter((signal) => engagementMetrics.commercialIntent.organic)
                .map((signal) => ({
                ...signal,
                strength: signal.strength * engagementMetrics.genuineInterestScore,
                context: {
                    ...signal.context,
                    environmentalFactors: {
                        ...signal.context.environmentalFactors,
                        market: this.getMarketInsights(engagementMetrics),
                        temporal: this.getTemporalInsights(engagementMetrics),
                    },
                },
            }));
        }
        catch (error) {
            console.error('Error aggregating demand signals:', error);
            return [];
        }
    }
    determineEngagementType(signal) {
        // Logic to determine engagement type based on signal characteristics
        if (signal.context.primaryDrivers.complexity > 0.8)
            return 'article_read';
        if (signal.velocity > 0.7)
            return 'content_share';
        return 'dwell_time';
    }
    estimateEngagementDuration(signal) {
        // Estimate engagement duration based on signal properties
        return signal.context.primaryDrivers.complexity * 600; // Up to 10 minutes
    }
    extractTopics(signal) {
        // Extract topics from signal context
        return [signal.context.primaryDrivers.need];
    }
    calculateSentiment(signal) {
        // Calculate sentiment from -1 to 1
        return signal.strength * 2 - 1;
    }
    getMarketInsights(metrics) {
        return Array.from(metrics.topicResonance.entries())
            .filter(([_, score]) => score > 0.7)
            .map(([topic]) => topic);
    }
    getTemporalInsights(metrics) {
        return [
            `Engagement Pattern: ${metrics.engagementPattern.consistency * 100}% consistent`,
            `Value Alignment: ${metrics.commercialIntent.valueAlignment * 100}% aligned`,
        ];
    }
    async fetchSignals(source) {
        // Implement actual API calls here
        // For now, we'll start with public, unauthenticated endpoints
        return [];
    }
    processSignals(rawSignals, type) {
        switch (type) {
            case 'search':
                return this.processSearchSignals(rawSignals);
            case 'social':
                return this.processSocialSignals(rawSignals);
            case 'news':
                return this.processNewsSignals(rawSignals);
            case 'regulatory':
                return this.processRegulatorySignals(rawSignals);
            default:
                return [];
        }
    }
    correlateSignals(signals, context) {
        // Group related signals
        const correlatedSignals = new Map();
        signals.forEach((signal) => {
            const key = this.getCorrelationKey(signal, context);
            if (!correlatedSignals.has(key)) {
                correlatedSignals.set(key, []);
            }
            correlatedSignals.get(key)?.push(signal);
        });
        // Merge correlated signals
        return Array.from(correlatedSignals.values()).map((group) => this.mergeSignals(group));
    }
    async analyzeSignalQuality(signal) {
        const qualityFactors = {
            // Source credibility based on historical accuracy
            sourceTrust: this.historicalAccuracy.get(signal.type) || 0.5,
            // Signal strength and consistency
            signalStrength: this.calculateSignalStrength(signal),
            // Context completeness
            contextCompleteness: this.evaluateContext(signal.context),
            // Resonance with existing patterns
            patternResonance: await this.calculatePatternResonance(signal),
        };
        return Object.values(qualityFactors).reduce((acc, val) => acc + val, 0) / 4;
    }
    calculateSignalStrength(signal) {
        const velocityFactor = Math.min(Math.abs(signal.velocity) / 10, 1);
        const accelerationFactor = Math.min(Math.abs(signal.acceleration) / 5, 1);
        const strengthFactor = Math.min(signal.strength, 1);
        return (velocityFactor + accelerationFactor + strengthFactor) / 3;
    }
    evaluateContext(context) {
        const scores = {
            drivers: this.evaluateDrivers(context.primaryDrivers),
            factors: this.evaluateFactors(context.environmentalFactors),
            dynamics: this.evaluateDecisionDynamics(context.decisionDynamics),
        };
        return Object.values(scores).reduce((acc, val) => acc + val, 0) / 3;
    }
    evaluateDrivers(drivers) {
        if (!drivers.need || drivers.urgency < 0 || drivers.complexity < 0) {
            return 0;
        }
        const needScore = drivers.need.length > 10 ? 1 : drivers.need.length / 10;
        const urgencyScore = Math.min(drivers.urgency, 1);
        const complexityScore = Math.min(drivers.complexity, 1);
        return (needScore + urgencyScore + complexityScore) / 3;
    }
    evaluateFactors(factors) {
        const scores = {
            market: factors.market.length > 0 ? 1 : 0,
            organizational: factors.organizational.length > 0 ? 1 : 0,
            temporal: factors.temporal.length > 0 ? 1 : 0,
        };
        return Object.values(scores).reduce((acc, val) => acc + val, 0) / 3;
    }
    evaluateDecisionDynamics(dynamics) {
        if (dynamics.stakeholders.size === 0) {
            return 0;
        }
        const stakeholderScores = Array.from(dynamics.stakeholders.values()).map((s) => (s.influence + s.readiness) / 2);
        const avgStakeholderScore = stakeholderScores.reduce((acc, val) => acc + val, 0) / stakeholderScores.length;
        const catalystScore = dynamics.catalysts.length > 0 ? 1 : 0;
        const barrierScore = dynamics.barriers.length > 0 ? 1 : 0;
        return (avgStakeholderScore + catalystScore + barrierScore) / 3;
    }
    async calculatePatternResonance(signal) {
        const currentPatterns = this.patterns.getValue();
        if (currentPatterns.length === 0) {
            return 0.5; // Neutral score for first signal
        }
        const resonanceScores = currentPatterns.map((pattern) => {
            const signalResonance = pattern.signals.map((s) => this.calculateSignalCoherence(s, signal));
            return Math.max(...signalResonance);
        });
        return Math.max(...resonanceScores);
    }
    async enhanceSignalContext(signal) {
        // Enhance resonance patterns
        signal.resonancePatterns.withHistoricalPatterns = await this.findHistoricalResonance(signal);
        signal.resonancePatterns.withPredictedOutcomes = await this.predictOutcomes(signal);
        // Enhance context
        signal.context = await this.enrichContext(signal.context);
        return signal;
    }
    async findHistoricalResonance(signal) {
        const resonance = new Map();
        const patterns = this.patterns.getValue();
        patterns.forEach((pattern) => {
            const matchScore = this.calculatePatternMatch(signal, pattern);
            if (matchScore > 0.7) {
                // Only consider strong matches
                resonance.set(pattern.signals[0].type, matchScore);
            }
        });
        return resonance;
    }
    calculatePatternMatch(signal, pattern) {
        const velocityMatch = 1 -
            Math.abs(signal.velocity - pattern.momentum) / Math.max(signal.velocity, pattern.momentum);
        const strengthMatch = 1 -
            Math.abs(signal.strength - pattern.confidence) /
                Math.max(signal.strength, pattern.confidence);
        const contextMatch = this.compareContexts(signal.context, pattern.signals[0].context);
        return (velocityMatch + strengthMatch + contextMatch) / 3;
    }
    compareContexts(c1, c2) {
        const driverMatch = c1.primaryDrivers.need === c2.primaryDrivers.need ? 1 : 0;
        const factorMatch = this.compareArrays(c1.environmentalFactors.market, c2.environmentalFactors.market);
        const dynamicsMatch = this.compareStakeholders(c1.decisionDynamics.stakeholders, c2.decisionDynamics.stakeholders);
        return (driverMatch + factorMatch + dynamicsMatch) / 3;
    }
    compareArrays(arr1, arr2) {
        if (arr1.length === 0 || arr2.length === 0)
            return 0;
        const intersection = arr1.filter((x) => arr2.includes(x));
        return intersection.length / Math.max(arr1.length, arr2.length);
    }
    compareStakeholders(s1, s2) {
        const allKeys = new Set([...s1.keys(), ...s2.keys()]);
        if (allKeys.size === 0)
            return 0;
        let matchScore = 0;
        allKeys.forEach((key) => {
            const stake1 = s1.get(key);
            const stake2 = s2.get(key);
            if (stake1 && stake2) {
                const influenceMatch = 1 - Math.abs(stake1.influence - stake2.influence);
                const readinessMatch = 1 - Math.abs(stake1.readiness - stake2.readiness);
                matchScore += (influenceMatch + readinessMatch) / 2;
            }
        });
        return matchScore / allKeys.size;
    }
    async predictOutcomes(signal) {
        const outcomes = new Map();
        const patterns = this.patterns.getValue();
        // Find similar historical patterns
        const similarPatterns = patterns.filter((p) => this.calculatePatternMatch(signal, p) > 0.8);
        // Predict outcomes based on historical pattern success
        similarPatterns.forEach((pattern) => {
            const predictedSuccess = this.historicalAccuracy.get(pattern.signals[0].type) || 0.5;
            outcomes.set(pattern.signals[0].type, predictedSuccess);
        });
        return outcomes;
    }
    async enrichContext(context) {
        // Enrich primary drivers
        context.primaryDrivers = await this.enrichDrivers(context.primaryDrivers);
        // Enrich environmental factors
        context.environmentalFactors = await this.enrichFactors(context.environmentalFactors);
        // Enrich decision dynamics
        context.decisionDynamics = await this.enrichDynamics(context.decisionDynamics);
        return context;
    }
    async enrichDrivers(drivers) {
        return {
            ...drivers,
            complexity: this.calculateComplexity(drivers),
        };
    }
    calculateComplexity(drivers) {
        const needComplexity = drivers.need.split(' ').length / 10; // Complexity based on need description
        const urgencyFactor = drivers.urgency > 0.8 ? 1.2 : 1; // Higher urgency often means more complexity
        return Math.min(needComplexity * urgencyFactor, 1);
    }
    async enrichFactors(factors) {
        return {
            market: await this.enrichMarketFactors(factors.market),
            organizational: factors.organizational,
            temporal: this.updateTemporalFactors(factors.temporal),
        };
    }
    async enrichMarketFactors(factors) {
        return factors.map((factor) => ({
            ...factor,
            relevance: this.calculateMarketRelevance(factor),
            impact: this.estimateMarketImpact(factor),
        }));
    }
    calculateMarketRelevance(factor) {
        // Implementation depends on factor structure
        return 0.8; // Placeholder
    }
    estimateMarketImpact(factor) {
        // Implementation depends on factor structure
        return 0.7; // Placeholder
    }
    updateTemporalFactors(factors) {
        const now = new Date('2024-12-20T11:45:27-05:00').getTime();
        return factors.map((factor) => ({
            ...factor,
            timeToImpact: factor.expectedTime ? factor.expectedTime - now : 0,
            relevance: this.calculateTemporalRelevance(factor, now),
        }));
    }
    calculateTemporalRelevance(factor, now) {
        if (!factor.expectedTime)
            return 0.5;
        const timeDiff = Math.abs(factor.expectedTime - now);
        const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
        // Higher relevance for factors within next 30 days
        return Math.max(0, 1 - daysDiff / 30);
    }
    async enrichDynamics(dynamics) {
        return {
            stakeholders: await this.enrichStakeholders(dynamics.stakeholders),
            catalysts: dynamics.catalysts,
            barriers: this.prioritizeBarriers(dynamics.barriers),
        };
    }
    async enrichStakeholders(stakeholders) {
        const enriched = new Map();
        for (const [key, value] of stakeholders) {
            enriched.set(key, {
                ...value,
                influence: this.recalculateInfluence(value),
                readiness: await this.assessReadiness(value),
            });
        }
        return enriched;
    }
    recalculateInfluence(stakeholder) {
        const constraintImpact = stakeholder.constraints.length * 0.1;
        return Math.max(0, Math.min(1, stakeholder.influence - constraintImpact));
    }
    async assessReadiness(stakeholder) {
        const constraintSeverity = stakeholder.constraints.reduce((acc, c) => acc + (c.severity || 0.5), 0);
        return Math.max(0, Math.min(1, stakeholder.readiness - constraintSeverity / stakeholder.constraints.length));
    }
    prioritizeBarriers(barriers) {
        return barriers.sort((a, b) => {
            const aImpact = a.impact || 0;
            const bImpact = b.impact || 0;
            const aDifficulty = a.difficulty || 0;
            const bDifficulty = b.difficulty || 0;
            // Higher impact and lower difficulty gets higher priority
            const aScore = aImpact / (aDifficulty + 0.1);
            const bScore = bImpact / (bDifficulty + 0.1);
            return bScore - aScore;
        });
    }
}
exports.DemandPrecognition = DemandPrecognition;
//# sourceMappingURL=demandPrecognition.js.map