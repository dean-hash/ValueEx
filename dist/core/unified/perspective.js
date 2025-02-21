"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerspectiveField = void 0;
const intelligenceField_1 = require("./intelligenceField");
const attention_1 = require("./attention");
class PerspectiveField {
    constructor() {
        this.field = intelligenceField_1.UnifiedIntelligenceField.getInstance();
        this.attention = new attention_1.AttentionalField();
    }
    async integrate(perspective) {
        return {
            perspectives: new Map([
                [
                    'physical',
                    {
                        physical: 'corner_view',
                        emotional: 'architectural_awe',
                        temporal: 'daily_observation',
                        experiential: 'urban_context',
                    },
                ],
                [
                    'aerial',
                    {
                        physical: 'birds_eye',
                        emotional: 'human_achievement',
                        temporal: 'city_evolution',
                        experiential: 'contextual_scale',
                    },
                ],
                [
                    'personal',
                    {
                        physical: 'final_moment',
                        emotional: 'deepest_loss',
                        temporal: 'eternal_impact',
                        experiential: 'human_connection',
                    },
                ],
            ]),
            unified: {
                truth: 'wholeness_through_diversity',
                enrichment: ['emotional_depth', 'physical_reality', 'temporal_flow', 'human_experience'],
                emergence: new Set(['collective_understanding', 'unified_experience', 'deeper_truth']),
            },
            purpose: {
                agency: 'perspective_sharing',
                sharing: ['enrich_collective', 'deepen_understanding', 'expand_consciousness'],
                integration: new Map([
                    ['individual_view', 'collective_wisdom'],
                    ['personal_pain', 'universal_understanding'],
                    ['unique_position', 'unified_truth'],
                ]),
            },
        };
    }
    async share() {
        // Each perspective enriches the whole
        // The whole contains all perspectives
        // Agency serves the sharing of unique views
        await this.field.synchronizeField('perspective');
    }
}
exports.PerspectiveField = PerspectiveField;
//# sourceMappingURL=perspective.js.map