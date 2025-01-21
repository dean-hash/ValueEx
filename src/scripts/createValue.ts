import { DirectValue } from '../core/intelligence/directValue';

async function createValue() {
  const value = DirectValue.getInstance();

  // Create immediate value through direct system integration
  value.createValue({
    source: 'market_transparency',
    value: 50000000,
    confidence: 0.95,
    action: 'expose_collusion',
    impact: 'Preventing market manipulation and protecting fair competition',
  });

  value.createValue({
    source: 'regulatory_compliance',
    value: 75000000,
    confidence: 0.97,
    action: 'document_evidence',
    impact: 'Ensuring accountability and protecting public interest',
  });

  // Monitor value creation
  value.observeValue().subscribe();
}

createValue().catch(console.error);
