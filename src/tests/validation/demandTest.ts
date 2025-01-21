import { DemandValidator } from '../../services/mvp/demandValidator';
import { logger } from '../../utils/logger';

// Real Reddit posts/comments (anonymized)
const REAL_WORLD_QUERIES = [
  // High intent, specific need
  'Need help finding a standing desk for small apartment, max $300, must be stable enough for dual monitors',
  'Looking for ergonomic chair recommendations - suffering from lower back pain, budget $500',
  'Anyone know good noise-cancelling headphones for open office? Need them by next week for new job',

  // Medium intent, researching
  'Comparing Herman Miller Aeron vs. Steelcase Leap for home office',
  "What's a good mechanical keyboard for programming? Cherry MX Browns preferred",
  'Best budget ultrawide monitors for productivity?',

  // Low intent, casual
  'Thinking about upgrading my home office setup',
  'Are standing desks worth it?',
  'Cool office gadgets',

  // Urgent needs (time-sensitive)
  'Need office chair ASAP - old one broke, back killing me',
  'Where to get same-day delivery monitor? Old one died, WFH meeting tomorrow',
  'Quick! Need webcam recommendation for interview in 2 days',

  // Price-sensitive
  "Cheapest standing desk that won't wobble?",
  'Poor student needs budget ergonomic setup recommendations',
  'Any deals on wireless keyboards right now?',

  // Specific problems to solve
  'Monitor arm for heavy 34" ultrawide? Current one keeps sagging',
  'Need solution for cable management in rental apartment (no drilling)',
  'Headphones that work with both laptop and phone for quick switching during calls',
];

interface ValidationResult {
  query: string;
  isReal: boolean;
  confidence: number;
  signals: Array<{
    type: string;
    strength: number;
    evidenceCount: number;
  }>;
  businessMetrics: {
    urgency: number; // 0-1: How soon they need it
    priceAwareness: number; // 0-1: How price-sensitive
    specificity: number; // 0-1: How specific their need is
    solvability: number; // 0-1: How easily we can fulfill this
  };
}

async function testDemandValidation(): Promise<ValidationResult[]> {
  const validator = DemandValidator.getInstance();
  const results: ValidationResult[] = [];

  logger.info('Starting comprehensive demand validation test');

  for (const query of REAL_WORLD_QUERIES) {
    try {
      const validation = await validator.validateDemand(query);

      // Calculate business metrics
      const businessMetrics = {
        urgency: calculateUrgency(query, validation),
        priceAwareness: calculatePriceAwareness(query, validation),
        specificity: calculateSpecificity(query, validation),
        solvability: calculateSolvability(query, validation),
      };

      const result: ValidationResult = {
        query,
        isReal: validation.isRealDemand,
        confidence: validation.confidence,
        signals: validation.signals.map((s) => ({
          type: s.type,
          strength: s.strength,
          evidenceCount: s.evidence.length,
        })),
        businessMetrics,
      };

      results.push(result);

      logger.info('Validation result:', {
        query,
        isReal: result.isReal,
        confidence: result.confidence,
        businessMetrics,
      });
    } catch (error) {
      logger.error('Error testing query:', query, error);
    }
  }

  // Analyze results
  analyzeResults(results);

  return results;
}

function calculateUrgency(query: string, validation: any): number {
  // Time-related keywords
  const urgentKeywords = [
    'asap',
    'urgent',
    'emergency',
    'tomorrow',
    'quick',
    'soon',
    'immediately',
  ];
  const hasUrgentKeywords = urgentKeywords.some((keyword) => query.toLowerCase().includes(keyword));

  // Problem indicators
  const problemKeywords = ['broke', 'died', 'killing', 'need', 'help'];
  const hasProblemKeywords = problemKeywords.some((keyword) =>
    query.toLowerCase().includes(keyword)
  );

  return (hasUrgentKeywords ? 0.6 : 0) + (hasProblemKeywords ? 0.4 : 0);
}

function calculatePriceAwareness(query: string, validation: any): number {
  // Price mentions
  const hasPricePoint =
    query.includes('$') ||
    query.toLowerCase().includes('budget') ||
    query.toLowerCase().includes('cheap');

  // Value indicators
  const valueKeywords = ['worth', 'deal', 'affordable', 'cost', 'price'];
  const hasValueConcern = valueKeywords.some((keyword) => query.toLowerCase().includes(keyword));

  return (hasPricePoint ? 0.7 : 0) + (hasValueConcern ? 0.3 : 0);
}

function calculateSpecificity(query: string, validation: any): number {
  // Product details
  const hasModelNumbers = /[A-Za-z0-9]+-[A-Za-z0-9]+/.test(query);
  const hasSpecs =
    query.includes('"') ||
    query.toLowerCase().includes('with') ||
    query.toLowerCase().includes('that has');

  // Use case
  const hasUseCase = query.toLowerCase().includes('for') || query.toLowerCase().includes('when');

  return (hasModelNumbers ? 0.4 : 0) + (hasSpecs ? 0.3 : 0) + (hasUseCase ? 0.3 : 0);
}

function calculateSolvability(query: string, validation: any): number {
  // Do we have products in this category?
  const commonCategories = ['chair', 'desk', 'monitor', 'keyboard', 'headphones'];
  const hasKnownCategory = commonCategories.some((cat) => query.toLowerCase().includes(cat));

  // Is the request reasonable?
  const hasReasonableExpectations =
    !query.toLowerCase().includes('best') || !query.toLowerCase().includes('perfect');

  return (hasKnownCategory ? 0.6 : 0) + (hasReasonableExpectations ? 0.4 : 0);
}

function analyzeResults(results: ValidationResult[]): void {
  // Business-focused analysis
  const actionableLeads = results.filter(
    (r) =>
      r.isReal &&
      r.businessMetrics.solvability > 0.7 &&
      (r.businessMetrics.urgency > 0.6 || r.businessMetrics.specificity > 0.7)
  );

  const highValueLeads = actionableLeads.filter(
    (r) => r.businessMetrics.priceAwareness < 0.5 && r.businessMetrics.specificity > 0.8
  );

  logger.info('Business Analysis:', {
    totalQueries: results.length,
    actionableLeads: actionableLeads.length,
    actionablePercentage: (actionableLeads.length / results.length) * 100,
    highValueLeads: highValueLeads.length,
    highValuePercentage: (highValueLeads.length / results.length) * 100,

    averageMetrics: {
      urgency: average(results.map((r) => r.businessMetrics.urgency)),
      priceAwareness: average(results.map((r) => r.businessMetrics.priceAwareness)),
      specificity: average(results.map((r) => r.businessMetrics.specificity)),
      solvability: average(results.map((r) => r.businessMetrics.solvability)),
    },

    topActionableQueries: actionableLeads
      .sort(
        (a, b) =>
          b.businessMetrics.urgency +
          b.businessMetrics.specificity -
          (a.businessMetrics.urgency + a.businessMetrics.specificity)
      )
      .slice(0, 5)
      .map((r) => ({
        query: r.query,
        metrics: r.businessMetrics,
      })),
  });
}

function average(numbers: number[]): number {
  return numbers.reduce((a, b) => a + b, 0) / numbers.length;
}

// Run if called directly
if (require.main === module) {
  testDemandValidation().catch((error) => {
    logger.error('Test failed:', error);
    process.exit(1);
  });
}
