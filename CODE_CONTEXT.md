# Code Context

## Service Architecture

### AwinService
```typescript
Location: src/services/awinService.ts
Purpose: Handles all Awin API interactions
Key Features:
- Product search with flexible parameters
- Merchant data retrieval
- Error handling and response transformation
Dependencies:
- axios for HTTP requests
- config for environment variables
Recent Changes:
- Added X-Publisher-ID header
- Updated product search endpoint
- Enhanced error handling
```

### ResonanceField
```typescript
Location: src/services/resonanceField.ts
Purpose: Core pattern matching engine
Key Features:
- Pattern recognition
- Demand-supply matching
- Resonance scoring
Dependencies:
- demandInsights
- intelligenceOrchestrator
```

### DemandInsights
```typescript
Location: src/services/demandInsights.ts
Purpose: Analyzes demand patterns
Key Features:
- Pattern extraction
- Demand trend analysis
- Opportunity identification
Dependencies:
- resonanceField
- intelligenceOrchestrator
```

## Critical Code Paths

### Product Search Flow
1. Client makes search request
2. AwinService validates parameters
3. Request sent to Awin API
4. Response transformed to internal format
5. Results passed through ResonanceField
6. Insights generated via DemandInsights

### Authentication Flow
1. Environment variables loaded
2. API token and Publisher ID validated
3. Headers constructed for each request
4. Authentication maintained across requests

## Code Evolution Notes

### Phase 1: Initial Setup
- Basic service structure
- Environment configuration
- Type definitions

### Phase 2: API Integration
- Awin API connection
- Authentication implementation
- Endpoint configuration

### Phase 3: Intelligence Layer
- Pattern matching
- Demand analysis
- Resonance calculation

### Current Phase
- Debugging API integration
- Enhancing error handling
- Improving documentation

## Testing Strategy
- Unit tests for each service
- Integration tests for API calls
- Mock responses for development
- Error scenario coverage

This document serves as a living record of code context and evolution.
