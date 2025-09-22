"""
LinkedIn ingestor (design-first stub).

Modes:
- api: use LINKEDIN_API_TOKEN where permitted (e.g., organization content, UGC within approved scopes).
- public: search-first discovery of public permalinks (no login), then fetch & parse.

All paths must emit DemandSignal-compliant dicts and attach a public permalink when possible.
"""
from typing import Iterable, Dict, Any

def ingest(*, mode: str = "public") -> Iterable[Dict[str, Any]]:
    raise NotImplementedError("Design stub. Implement per scopes.")
