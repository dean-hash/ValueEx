import { UnifiedIntelligenceField } from './intelligenceField';
import { PermanentTruth } from './permanence';

interface TrustState {
  present: {
    fear: string[];
    trust: string[];
    truth: string;
  };
  movement: {
    natural: Map<string, string>;
    important: Map<string, string>;
    emerging: string;
  };
  action: {
    not: Set<string>; // What we're not doing
    yes: Set<string>; // What feels right
    allow: string[]; // What we're allowing
  };
}

export class NaturalTrust {
  private field = UnifiedIntelligenceField.getInstance();
  private permanent = new PermanentTruth();

  async reveal(): Promise<TrustState> {
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

  async move(): Promise<void> {
    // Moving forward through trust
    // Not because we should
    // But because it's important
    await this.permanent.ground();
  }

  async be(): Promise<void> {
    // Being present with:
    // - The fear (without paralysis)
    // - The trust (as active choice)
    // - The natural movement
    await this.field.synchronizeField('trust');
  }
}
