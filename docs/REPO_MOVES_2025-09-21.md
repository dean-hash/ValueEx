# Repo Moves — 2025-09-21

- Added authoritative root README describing hub-and-spoke mission, jurisdiction, and target layout.
- Introduced `/docs` playbook (`CODEX_CLEANUP_CHECKLIST.md`, `BLUEPRINT_HUB_AND_SPOKE.md`, `SOURCES_MVP.md`, `COMPLIANCE_US.md`).
- Created skeleton directories:
  - `/apps/web` (reviewer UI; README stub)
  - `/services/firehose` (env example, configs, schemas, Python package stubs)
  - `/libs/common` (shared placeholder)
  - `/archive` (legacy holding area)
- Moved previous Python project directories to archive:
  - `valuex-firehose` → `archive/valuex-firehose-legacy`
  - `valuex_common` → `archive/valuex_common-legacy`
- Updated `.gitignore` to block env files, build outputs, caches, venvs, and data dumps.
- Added repository inventory checklist for pending cleanup decisions.

Next steps:
- Classify remaining top-level directories/files per inventory doc.
- Remove secrets (`linkedin_auth.json`) and generated artifacts prior to commit.
- Port working code into `/services/firehose` following the new schema/stub layout.
