# ValueX

**Mission:** Find public demand in the U.S., rank it for actionability, match to available offers (AWIN live, Fiverr links; CJ later), and prepare a respectful, human-approved outreach.
**Truth model:** Hub-and-Spoke.

- **Jurisdiction:** **US-only** at MVP (US-CA stricter). EU/UK disabled. Cold outreach allowed with disclosure + opt-out logging.
- **Demand spokes:** Reddit, Hacker News, Stack Overflow, GitHub, YouTube comments, **Social-Lite (public-only Facebook/TikTok/LinkedIn)**, plus machine-readable sources (JSON-LD/OpenGraph/Microdata, Sitemaps/Feeds, Autocomplete, Google Trends).
- **Supply spokes:** **AWIN (API tested)**, **Fiverr (3 static affiliate links)**, **CJ (not onboarded yet)**; future networks later.
- **Outreach:** Human-in-the-loop approve/send; every suggestion ships with an evidence packet (public permalink + quote + timestamp + jurisdiction).

## Repository layout (authoritative)
`
/apps/web            # Next.js app (review proposals, approve outreach, telemetry)
/services/firehose   # Python service (ingest → normalize → score → match → propose)
/libs/common         # Shared docs/schemas (thin), future shared code
/docs                # Design + compliance + sources + cleanup guides
/archive             # Compiled artifacts, old scaffolds, duplicates (to be removed)

`

> **Status reality:** A Python firehose exists locally (working tree) and is **not yet pushed**. This repo adds the design + stubs so CodeX can reorganize safely.
