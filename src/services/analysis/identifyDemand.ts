import { DemandInference } from './providers/demandInference';

export async function identifyDemand(input: string): Promise<string> {
  // Instantiate DemandInference and initialize classifier
  const inferencer = new DemandInference();
  inferencer.initializeClassifier();

  // Since the classifier is private, we temporarily bypass the access restriction
  // This uses a type cast to any to call the classify method from natural.BayesClassifier
  const classification = (inferencer as any).classifier.classify(input);
  return classification;
}
