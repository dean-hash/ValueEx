import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, filter, debounceTime } from 'rxjs/operators';
import { DemandPattern } from '../types/demandPattern';
import { AwinProduct, AwinSearchParams } from '../types/awinTypes';

interface ResonanceVector {
    dimension: string;
    magnitude: number;
    direction: number;
}

interface ResonanceState {
    vectors: ResonanceVector[];
    coherence: number;  // How well the vectors align
    intensity: number;  // Overall field strength
}

export class ResonanceField {
    private supplyField = new BehaviorSubject<ResonanceState>({ vectors: [], coherence: 0, intensity: 0 });
    private demandField = new BehaviorSubject<ResonanceState>({ vectors: [], coherence: 0, intensity: 0 });

    // Observable that emits when resonance occurs between supply and demand
    resonance$ = combineLatest([this.supplyField, this.demandField]).pipe(
        map(([supply, demand]) => this.calculateResonance(supply, demand)),
        filter(resonance => resonance.intensity > 0),
        debounceTime(100)
    );

    private calculateResonance(supply: ResonanceState, demand: ResonanceState): ResonanceState {
        // Calculate coherence based on vector alignment
        const coherence = this.calculateCoherence(supply.vectors, demand.vectors);

        // Calculate intensity based on overall field strength
        const intensity = this.calculateIntensity(supply.vectors, demand.vectors);

        return {
            vectors: [...supply.vectors, ...demand.vectors],
            coherence,
            intensity
        };
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
        // Example logic: calculate combined magnitude
        const totalMagnitude = [...supplyVectors, ...demandVectors].reduce((sum, vector) => sum + vector.magnitude, 0);
        return totalMagnitude / (supplyVectors.length + demandVectors.length);
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
            resonanceScore: this.calculateProductResonance(product, pattern)
        }));
    }

    private calculateProductResonance(product: AwinProduct, pattern: DemandPattern): number {
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
