export interface DemandPattern {
  id: string;
  keywords: string[];
  category: string;
  priceRange?: {
    min?: number;
    max?: number;
  };
  location?: {
    country: string;
    region?: string;
    latitude?: number;
    longitude?: number;
  };
  intensity: number; // How strong is the demand signal (1-10)
  context?: {
    purpose?: string;
    urgency?: number;
    preferences?: string[];
    constraints?: string[];
  };
  temporalFactors?: {
    seasonality?: boolean;
    timeOfDay?: boolean;
    specialEvents?: string[];
  };
  resonanceFactors?: {
    sustainability?: number;
    localImpact?: number;
    culturalRelevance?: number;
    innovationLevel?: number;
  };
  signals: Array<{
    type: string;
    strength: number;
    source: string;
  }>;
  confidence: number;
  coherence: number;
  spatialFactors: {
    density: number;
    distribution: 'clustered' | 'dispersed' | 'random';
    hotspots: Array<{
      location: {
        latitude: number;
        longitude: number;
      };
      intensity: number;
    }>;
  };
}
