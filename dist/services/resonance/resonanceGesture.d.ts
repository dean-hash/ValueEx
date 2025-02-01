import { ValueOpportunity } from '../value/valueOpportunity';
import { Action } from '../actions/action';
export declare class ResonanceGesture {
  private opportunity;
  private field;
  private amplitude;
  private frequency;
  private phase;
  private coherence;
  constructor(opportunity: ValueOpportunity);
  private initializeFromOpportunity;
  amplify(): Promise<void>;
  private measureCoherence;
  transformToAction(): Promise<Action>;
  private determineActionType;
  private calculateTiming;
  private executeHarmonically;
  private executeCycle;
}
