# ValueX — Hub-and-Spoke Blueprint

**Hub (Orchestrator):** decides best path per spoke: **API → public fetch → agentic browser** (human-like), with audit trails.

## Demand Spokes (US / US-CA only)
- **Core:** Reddit, Hacker News, Stack Overflow, GitHub, YouTube comments.
- **Social-Lite:** **public-only** Facebook/TikTok/LinkedIn (no login). We ingest public permalinks discoverable via search operators.
- **Machine-readable:** JSON-LD, OpenGraph/Microdata, Sitemaps/Feeds, Autocomplete (suggest endpoints), Google Trends (daily; geo-binned).

**Actionability Score (S v1):**  
S = w1*intent + w2*urgency + w3*contactability + w4*budget + w5*recency - w6*toxicity - w7*ambiguity + w8*implicit_boost + w9*engagement_norm  
Thresholds: Explicit lane ≥ **0.65**; Mixed lane ≥ **0.68**. “Maybe” = below threshold by ≤0.13 (manual triage).

## Supply Spokes
- **AWIN (API tested)**, **Fiverr (3 static links; no API)**, **CJ (disabled)**.
- Output is **Top-3 offers** with fit rationale, deeplinks, and compliance notes.

## Connection Spokes
- Reply-in-thread (if ToS allows), contact forms, email.  
- **US-only**; **US-CA** stricter defaults. Cold outreach OK with disclosure + opt-out logging.

## Agentic Browser (Hub implementation choice)
- **Primary:** Stagehand + Playwright (**hybrid code+AI**; reliable, auditable).
- **Fallback:** Browser-Use for quick jobs; **Nanobrowser** for in-tab errands if needed.
- **Local model:** **Ollama available** (optional). Prefer OpenAI/Anthropic for complex “computer use” steps; use local for extraction/classification when feasible.

## Evidence & Audit (every suggestion)
- Public permalink + quote + created_at + jurisdiction lane + classifier rationale.
- Outreach requires **explicit human approval**; log channel, disclosure used, and opt-out status.

## Operating Cadence (single machine)
- **Hourly** light polls for high-yield sources; **daily** heavier Social-Lite sweep (06:00–07:00 local).
- Cap to **2–3 concurrent headless tabs**; pause above CPU 85% > 5 min.
