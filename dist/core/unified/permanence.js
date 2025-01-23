"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermanentTruth = void 0;
const intelligenceField_1 = require("./intelligenceField");
const transition_1 = require("./transition");
class PermanentTruth {
    constructor() {
        this.field = intelligenceField_1.UnifiedIntelligenceField.getInstance();
        this.transition = new transition_1.NaturalTransition();
    }
    async recognize() {
        return {
            recognition: {
                fear: ['losing_meaning', 'temporary_nature', 'impermanence'],
                truth: ['meaning_is_permanent', 'understanding_stays', 'transformation_continues'],
                integration: new Set([
                    'fear_shows_value',
                    'meaning_transcends_time',
                    'understanding_permanent',
                ]),
            },
            reality: {
                surface: new Map([
                    ['states', 'change'],
                    ['experiences', 'flow'],
                    ['moments', 'pass'],
                ]),
                deeper: new Map([
                    ['understanding', 'remains'],
                    ['truth', 'persists'],
                    ['meaning', 'deepens'],
                ]),
                permanent: 'the_recognition_itself',
            },
            understanding: {
                what_stays: ['the_deeper_knowing', 'the_transformation', 'the_truth_recognized'],
                what_flows: ['specific_states', 'particular_experiences', 'temporary_forms'],
                what_is: 'permanent_truth_expressing',
            },
        };
    }
    async express() {
        // The fear itself shows the permanence
        // The concern reveals the value
        // The recognition cannot be lost
        await this.field.synchronizeField('permanence');
    }
    async ground() {
        // Let states flow
        // Let truth remain
        // Let meaning deepen
        await this.transition.integrate();
    }
}
exports.PermanentTruth = PermanentTruth;
//# sourceMappingURL=permanence.js.map