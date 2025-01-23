# ValueEx

Intelligent Supply-Demand Matching Platform that connects US businesses with high-value opportunities through data-driven market analysis.

## Project Status (as of 2025-01-15)

### 🟢 Working Features
- Awin API Integration (Product Search, Merchant Analysis)
- Market Intelligence Engine
- Revenue Metrics Analysis
- US Business Targeting

### 🎯 Current Focus
- Direct B2B Outreach
- US Market Opportunities
- High-Value Lead Generation
- Data-Driven Sales Strategy

## Core Features

- 🤖 Intelligent Market Analysis
- 🔒 Privacy-First Approach
- 🎯 Precise Supply-Demand Matching
- 📊 Data-Driven Decisions
- 🤝 Ethical Affiliate Partnerships

## Documentation Structure
- [Architecture Overview](docs/ARCHITECTURE.md)
- [Data Sources](docs/DATA_SOURCES.md)
- [Integration Status](docs/INTEGRATIONS.md)
- [Development Guide](docs/DEVELOPMENT.md)
- [Testing Strategy](docs/TESTING.md)

## Getting Started

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your credentials
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start development server:
   ```bash
   npm run dev
   ```

## Recent Updates (2025-01-15)

### Enhanced Product Search and Price Range Handling
- Improved `AwinService` to properly handle price range filters in product searches
- Added comprehensive validation for price ranges in `UnifiedIntelligenceField`
- Updated `DemandPattern` interface to include price range in context object
- Fixed Logger initialization across services

### Documentation Updates
- Added JSDoc documentation to all major classes and methods
- Improved code readability with detailed parameter and return type descriptions
- Updated interface documentation for better type safety

### Testing Improvements
- Updated test suite to use correct method names and mock objects
- Added tests for price range validation and product search functionality

## Current Architecture

- `src/core/` - Core Intelligence
  - `unified/` - Unified Intelligence Field
  - `resonance/` - Resonance Pattern Engine
  
- `src/services/` - Core Services
  - `awin/` - Affiliate Network Integration
  - `domain/` - Domain Management
  - `analysis/` - Market Analysis
  - `email/` - Communication Management

## Environment Variables

Required variables are documented in `.env.example`. Current requirements:
- OpenAI API Key ( Configured)
- GoDaddy API Credentials ( Configured)
- Awin API Credentials ( Pending)
- Email Configuration ( Planned)
- Domain Settings ( Configured)

## Security

- All sensitive data is encrypted
- Minimal data collection
- Immediate disposal of temporary data
- Rate-limited API interactions

## Development Status

See [DEVELOPMENT.md](docs/DEVELOPMENT.md) for:
- Current issues (55 identified)
- Test coverage status
- Integration status
- Upcoming features

## Contributing

Please see [CONTRIBUTING.md](docs/CONTRIBUTING.md) for development guidelines.
