"""
So ingestor (design-first stub).

All paths must emit DemandSignal-compliant dicts and attach a public permalink when possible.
"""
from typing import Iterable, Dict, Any

def ingest(*, mode: str = "public") -> Iterable[Dict[str, Any]]:
    raise NotImplementedError("Design stub. Implement per source capabilities.")
