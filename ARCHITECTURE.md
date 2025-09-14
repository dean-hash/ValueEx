# ValueX Workspace Architecture

This document describes how environment variables are layered and owned across the workspace, and maps key variables to their consumers. It also introduces preflight doctor scripts to validate configuration and connectivity.

## Overview

- The workspace contains two projects:
  - `valuex-firehose/`: ingestion, routing, metrics, and LLM triage.
  - `resonance/`: affiliate offers, notifications, and curated demand resonance utilities.
- All scripts load environment variables in a layered order:
  1) Workspace-level `.env` at the repository root.
  2) Project-level `.env` inside each project directory (overrides workspace values).
- This approach enables workspace-wide defaults while allowing project-specific overrides without cross-project leakage.

## Shared Utilities (valuex_common)

- Shared workspace-level package `valuex_common/` centralizes helpers used by both projects:
  - `valuex_common/normalization.py`: `normalize_url`, `text_signature`, `normalize_email`, `normalize_phone`.
  - `valuex_common/url.py`: `with_query` for appending query params while preserving original URLs.
- Both `valuex-firehose/` and `resonance/` import from `valuex_common` to avoid duplication.

## Affiliate Link Centralization

- Central builder:
  - Canonical mutation functions live in `valuex-firehose/linker/builder.py` (single source of truth).
  - High-level API remains `valuex-firehose/offers/linker.py::build_affiliate_url(...)`, which delegates to the builder for all Fiverr/AWIN URL mutations.
  - See `valuex-firehose/linker/CONTRACT.md` for invariants and test/verification details.
- `resonance/valuex_resonance/match_offers.py` delegates to the central builder for Fiverr and AWIN. It falls back to local behavior if the import is unavailable.
- Behavior guarantees:
  - Partner-provided base URLs are preserved exactly; only subtracking parameter `afp` is appended when missing.
  - No re-ordering of existing query items; no percent-encoding normalization; fragment preserved byte-for-byte.
- Verification script: `valuex-firehose/scripts/verify_fiverr_links.py` checks that outputs match env bases plus only the subtracking param.

## Layered .env Loading

- Common pattern used by all patched scripts:
  - Define `ROOT = Path(__file__).resolve().parents[1]`
  - Define `WORKSPACE = ROOT.parent`
  - `load_dotenv(WORKSPACE / ".env")`
  - `load_dotenv(ROOT / ".env", override=True)`
- Always load by absolute path after computing `ROOT` to avoid accidental leakage from current working directory.

## Ownership of Environment Variables

- Workspace-level `.env` is intended for:
  - Non-sensitive defaults shared across projects.
  - Developer-local services endpoints (e.g., `ROUTE_API`, `OLLAMA_URL`).
- Project-level `.env` is intended for:
  - Project-specific secrets and configuration.
  - API keys and credentials (never commit secrets).

## valuex-firehose Variables

- Routing and triage:
  - `ROUTE_API` (default `http://127.0.0.1:8000`) — local router base URL.
  - `LLM_TRIAGE` ("0"/"1") — enable triage near score boundary.
  - `LLM_TRIAGE_CENTER`, `LLM_TRIAGE_WINDOW` — gating thresholds.
  - `LLM_PROVIDER` — `ollama` (default) or `groq`.
- Provider-specific:
  - `OLLAMA_URL` (default `http://127.0.0.1:11434`), `OLLAMA_MODEL` (e.g., `llama3.1:8b`).
  - `GROQ_API_KEY`, `GROQ_MODEL` (e.g., `llama-3.1-8b-instant`).
- Operational flags:
  - `MONETIZE_SHADOW` — run monetization in shadow mode.
  - `LEADS_V2_ONLY` — gate new lead pipeline.
  - `INGEST_METRICS_KEY` — simple auth for metrics, if applicable.

Consumers:

- `valuex-firehose/ingest/runner.py` — `LLM_TRIAGE*`, `MONETIZE_SHADOW`, `LEADS_V2_ONLY`, `ROUTE_API`.
- `valuex-firehose/monetize/llm_triage.py` — `LLM_PROVIDER`, `OLLAMA_*`, `GROQ_*`.
- `valuex-firehose/scripts/check_ollama.py` — `OLLAMA_*`.
- `valuex-firehose/scripts/check_connectivity.py` — `ROUTE_API`.

## resonance Variables

- Affiliates (AWIN):
  - `AWIN_API_KEY` (or `AWIN_API_TOKEN`), `AWIN_PUBLISHER_IDS`, `AWIN_PRIMARY_PUBLISHER_ID`, `AWIN_ADVERTISER_IDS` (optional allowlist).
- Affiliates (Fiverr):
  - `FIVERR_LINK_MARKETPLACE`, `FIVERR_LINK_PRO`, `FIVERR_LINK_LOGOMAKER`, `FIVERR_SUBID_PREFIX`.
- Notifications:
  - `SLACK_WEBHOOK_URL`.
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`, `ALERT_EMAIL_TO`.
- Ingest keys used by individual scripts:
  - `BING_API_KEY` (e.g., `scripts/ingest_linkedin_search.py`).
  - `X_BEARER_TOKEN` (e.g., `scripts/ingest_x.py`).

Consumers:

- `resonance/scripts/affiliate_refresh.py` — AWIN.
- `resonance/scripts/check_affiliates.py` — AWIN, Fiverr, optional OpenAI.
- `resonance/scripts/digest_daily.py` and `resonance/scripts/run_all.py` — notifications.
- `resonance/scripts/ingest_linkedin_search.py` — `BING_API_KEY`.
- `resonance/scripts/ingest_x.py` — `X_BEARER_TOKEN`.

## Doctor Scripts (Preflight Checks)

- `valuex-firehose/scripts/doctor.py`:
  - Validates env flags presence.
  - Checks router endpoints (`/health`, `/metrics`, `/route`).
  - Validates LLM triage provider connectivity (Ollama or Groq).
- `resonance/scripts/doctor.py`:
  - Validates required env flags presence.
  - Checks AWIN token + publisher ID with a minimal API call.
  - Verifies Fiverr affiliate links via HEAD (no message sent).
  - Validates Slack webhook URL shape (does not send a message).
  - Attempts SMTP handshake and optional login; does not send email.

Both scripts load `.env` files using the layered approach above and print a concise JSON summary.

## How to Run

From the workspace root:

```bash
# Firehose preflight
python valuex-firehose/scripts/doctor.py

# Resonance preflight
python resonance/scripts/doctor.py
```

Interpretation:

- Each section contains `ok: true/false` with additional fields like HTTP status or error strings.
- Use failures to guide which `.env` file to update (project `.env` overrides workspace `.env`).

## Security Notes

- Keep all secrets in project-level `.env` files.
- Never commit real `.env` files to version control; only `.env.example` should be committed.
- The doctor scripts attempt minimal, non-destructive checks and avoid sending external notifications by default.

## Extending

- When adding a new script, always add layered `.env` loading using the pattern above.
- If a new external service is added, extend the relevant doctor script with a minimal health check and document new variables here.
