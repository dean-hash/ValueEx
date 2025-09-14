from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from typing import Dict, Iterable, Iterator, List, Optional
from valuex_common.normalization import normalize_url, text_signature

ISO_FMT = "%Y-%m-%dT%H:%M:%SZ"


def to_iso(ts: datetime | float | int | str) -> str:
    if isinstance(ts, (float, int)):
        dt = datetime.fromtimestamp(float(ts), tz=timezone.utc)
    elif isinstance(ts, str):
        # Try to parse, else return as-is
        try:
            dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
        except Exception:
            return ts
    elif isinstance(ts, datetime):
        dt = ts.astimezone(timezone.utc)
    else:
        dt = datetime.now(tz=timezone.utc)
    return dt.strftime(ISO_FMT)


def clean_text(s: str) -> str:
    s = re.sub(r"\s+", " ", s or "").strip()
    return s


def get_drop_title_res(phrases_cfg: Dict) -> List[re.Pattern]:
    lex = phrases_cfg.get("lex", {}) if isinstance(phrases_cfg, dict) else {}
    drop_title_patterns = (lex or {}).get(
        "drop_title_patterns",
        [
            r"\bmegathread\b",
            r"\bweekly\b",
            r"who'?s\s+hiring",
            r"hiring\s+thread",
            r"release\s+notes?",
            r"newsletter",
            r"changelog",
            r"announc(e|ement|ing)",
        ],
    )
    return [re.compile(pat, re.I) for pat in drop_title_patterns]


def dedupe_hash(text: str, permalink: str) -> str:
    """Stable hash using canonical URL and robust text signature.

    This improves cross-connector and cross-day deduplication compared to
    plain (text, permalink) hashing.
    """
    canon_url = normalize_url(permalink or "") or ""
    sig = text_signature(None, text or "", limit=400)
    basis = f"{canon_url}||{sig}"
    h = hashlib.sha256()
    h.update(basis.encode("utf-8", errors="ignore"))
    return h.hexdigest()


@dataclass
class Event:
    text: str
    permalink: str
    source: str
    ts: str

    def to_dict(self) -> Dict:
        return asdict(self)


# Helper to expand phrases into OR queries

def expand_queries(phrases: Dict, keys: List[str]) -> List[str]:
    out: List[str] = []
    for k in keys:
        items = phrases.get("phrases", {}).get(k, [])
        for it in items:
            if " " in it:
                out.append(f'"{it}"')
            else:
                out.append(it)
    return out
