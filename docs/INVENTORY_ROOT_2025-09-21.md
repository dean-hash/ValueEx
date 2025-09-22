# Repository Inventory (2025-09-21)

Status legend: **Keep** (align to new skeleton), **Archive** (move under `/archive`), **Review** (needs decision/content update).

| Path | Status | Notes |
|------|--------|-------|
| ARCHITECTURE.md | Review | Update to match new blueprint or move to `/archive`. |
| ENVIRONMENT.md | Review | Likely superseded by `/services/firehose/.env.example`; revise or archive. |
| README.md | Keep | New authoritative root README. |
| SCOPE.yaml | Review | Validate contents against hub-and-spoke lanes. |
| SETUP.md | Review | Ensure setup steps align with new structure; otherwise archive. |
| VX_NEXT.md | Review | Replace with roadmap excerpt that matches new hub-and-spoke focus. |
| audit/ | Archive | Legacy audit pipeline; retain under `archive/audit-legacy` if needed. |
| data/ | Archive | Generated data; move to `/archive/data` or delete. |
| debug_output.txt | Archive | Generated log. |
| docker-compose.crawl4ai.yml | Review | Decide if part of new stack; move under `/services/firehose` or archive. |
| filelist.txt, filelist.txt` | Archive | Workspace artifacts, safe to delete. |
| github_jobs_sample.json | Archive | Sample data from legacy fetcher. |
| job_search_error.png | Archive | Legacy debug screenshot. |
| linkedin_auth.json | Sensitive | Remove from git, store securely outside repo. |
| linkedin_sample.json | Archive | Legacy sample data. |
| login_error.png | Archive | Legacy debug screenshot. |
| login_exception.png | Archive | Legacy debug screenshot. |
| output/ | Archive | Generated content. |
| pyproject.toml | Review | Likely legacy root config; reconcile with new services firehose package. |
| reddit_sample.json | Archive | Legacy sample data. |
| resonance/ | Review | Nested repo; plan migration or archive (`archive/resonance-legacy`). |
| scripts/ | Review | Move relevant SQL/ops scripts under `/services` or `/apps`, archive the rest. |
| setup.py | Review | Likely obsolete; remove after confirming no packages rely on it. |
| tools/ | Review | Evaluate each tool; migrate critical ones into `/services/firehose` or archive. |
| archive/valuex-firehose-legacy | Archive | Legacy ingestion stack preserved for reference. |
| archive/valuex_common-legacy | Archive | Legacy shared utils preserved for reference. |
