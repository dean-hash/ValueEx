# CodeX Cleanup Checklist (Hub-and-Spoke Alignment)

## Keep & Move
- Keep the Next.js app; move to /apps/web/.
  - Choose **one** router: prefer **App Router**. If pages/ exists, mark it for archival after migration.
- Move support dirs/files under /apps/web (e.g., src/, prisma/, scripts/, 	ests/, docs/ if they are web-specific).
- Create /services/firehose/ and /libs/common/ if absent.

## Merge / Choose One
- ESLint/Jest config: keep **one** format (.json or .js / .ts).
- Env files: keep .env.example; remove any real .env from git.

## Archive (move to /archive/ first, then remove in a PR)
- dist/, coverage/, logs/, any compiled artifacts.
- Duplicate scaffolds (old routers, old configs).
- Cascade artifacts not referenced by /apps/web or /services/firehose.

## Add Authoritative Docs
- /docs/BLUEPRINT_HUB_AND_SPOKE.md
- /docs/SOURCES_MVP.md
- /docs/COMPLIANCE_US.md
- /services/firehose/README.md
- /apps/web/README.md

## Do Not Assume
- **AWIN**: API token tested but merchant mappings still WIP.
- **LinkedIn**: API token tested; **public-only mode** remains default; API used when scope/permissions allow.
- **CJ**: not onboarded; disabled.
