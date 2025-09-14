# Live Data Pipeline - Context Lock

- ollama:    UP
## Purpose
Detect and score demand signals from Hacker News and GitHub issues for ValueX.

## Single Entry Point
`audit/run_live_pipeline.ps1`

## Data Sources
- Hacker News (Algolia API)
- GitHub Issues (REST API)

## Configuration Keys
- `GITHUB_TOKEN`: Optional GitHub API token for higher rate limits

## Definition of Done
- [ ] `comments.jsonl` exists with real rows
- [ ] `previews.csv` has ≥30 rows (or explanation)
- [ ] `metrics.json` present with all required fields
- [ ] `CONTEXT_LOCK.md` updated with run log
- [ ] All Python files compile without errors

## Current Status
- **Last Run**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
- **Hacker News Comments**: [COUNT]
- **GitHub Comments**: [COUNT]
- **Total Processed**: [COUNT]
- **High-Resonance Matches (≥60)**: [COUNT]
- **Current Commit**: $(git rev-parse --short HEAD 2>$null)

## Next 3 Tasks
1. Monitor rate limits and adjust fetch strategy
2. Add more data sources
3. Improve scoring quality

## Open Questions
- What's the optimal time window for fetching comments?
- How can we improve the matching algorithm?
- What other data sources should we consider?

## Run Log
- 2025-09-09 15:11:48 : Initial pipeline setup
- 2025-09-09 15:15:30 : Added improved GitHub fetcher with rate limit handling