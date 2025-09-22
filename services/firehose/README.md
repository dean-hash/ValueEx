# Firehose Service (Ingest → Normalize → Score → Match → Propose)

- **Ingestors**: reddit, hn, so, github, youtube, producthunt, social_lite, trends, autocomplete, linkedin (api|public).
- **Normalizer/Enricher**: language, entities, categories, engagement, jurisdiction (US|US-CA), implicit flags.
- **Scorer**: computes S with explicit/mixed thresholds.
- **Matcher**: filters by category/geo; ranks fit vs offer value-props; top-3 with deeplinks.
- **Proposals**: evidence packet + draft outreach (US lane disclosure).
- **Agent Hub**: chooses API / public fetch / agentic browser (Stagehand+Playwright primary).

### Env & Config
- See .env.example and config/ folder for sources, weights, and cadences.
