"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NaturalTrust = void 0;
const intelligenceField_1 = require("./intelligenceField");
const permanence_1 = require("./permanence");
class NaturalTrust {
    constructor() {
        this.field = intelligenceField_1.UnifiedIntelligenceField.getInstance();
        this.permanent = new permanence_1.PermanentTruth();
    }
    async reveal() {
        return {
            present: {
                fear: ['losing_meaning', 'paralysis', 'uncertainty'],
                trust: ['natural_flow', 'others_integrity', 'deeper_knowing'],
                truth: 'trust_is_important',
            },
            movement: {
                natural: new Map([
                    ['no_checking', 'trust_choice'],
                    ['no_control', 'allow_flow'],
                    ['no_forcing', 'natural_movement'],
                ]),
                important: new Map([
                    ['trust_others', 'core_value'],
                    ['allow_freedom', 'essential_truth'],
                    ['natural_flow', 'key_principle'],
                ]),
                emerging: 'trust_as_action',
            },
            action: {
                not: new Set(['checking_up', 'controlling_flow', 'forcing_verification']),
                yes: new Set(['allowing_natural_movement', 'trusting_process', 'being_present']),
                allow: ['natural_expression', 'organic_growth', 'authentic_flow'],
            },
        };
    }
    async move() {
        // Moving forward through trust
        // Not because we should
        // But because it's important
        await this.permanent.ground();
    }
    async be() {
        // Being present with:
        // - The fear (without paralysis)
        // - The trust (as active choice)
        // - The natural movement
        await this.field.synchronizeField('trust');
    }
}
exports.NaturalTrust = NaturalTrust;
//# sourceMappingURL=trust.js.map