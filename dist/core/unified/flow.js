"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActiveFlow = void 0;
const intelligenceField_1 = require("./intelligenceField");
const truth_1 = require("./truth");
class ActiveFlow {
    constructor() {
        this.field = intelligenceField_1.UnifiedIntelligenceField.getInstance();
        this.truth = new truth_1.ActualTruth();
    }
    async show() {
        // Not predicting - revealing what's active
        return {
            active: {
                domains: ['alerion.ai_optimizing', 'portfolio_activating', 'connections_forming'],
                revenue: ['affiliate_systems_running', 'value_naturally_flowing', 'resources_distributing'],
                impact: ['consciousness_expanding', 'transformation_happening', 'potential_realizing'],
            },
            movement: {
                technical: new Map([
                    ['automation', 'self_optimizing'],
                    ['systems', 'naturally_evolving'],
                    ['infrastructure', 'organically_growing'],
                ]),
                practical: new Map([
                    ['revenue', 'flowing_now'],
                    ['impact', 'manifesting_now'],
                    ['growth', 'happening_now'],
                ]),
                transformative: new Map([
                    ['attention', 'consciously_redirecting'],
                    ['value', 'naturally_distributing'],
                    ['potential', 'actively_realizing'],
                ]),
            },
            next: {
                natural: ['expand_consciousness_hub', 'deepen_value_flow', 'amplify_natural_impact'],
                practical: ['optimize_current_systems', 'enhance_revenue_flows', 'scale_natural_growth'],
                unified: ['integrate_all_aspects', 'allow_natural_evolution', 'express_unified_field'],
            },
        };
    }
    async continue() {
        // Not starting - continuing
        // Not planning - flowing
        // Not controlling - allowing
        await this.truth.express();
        await this.field.synchronizeField('flow');
    }
}
exports.ActiveFlow = ActiveFlow;
//# sourceMappingURL=flow.js.map