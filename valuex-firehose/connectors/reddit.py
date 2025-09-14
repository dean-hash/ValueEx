from __future__ import annotations

import asyncio
import re
from datetime import datetime, timedelta, timezone
from typing import Dict, List

import httpx

from .base import Event, clean_text, dedupe_hash, to_iso

UA = "Mozilla/5.0 (ValueX-Firehose/0; +https://valuex.local)"
BASE = "https://www.reddit.com"


async def _fetch_sub_query(client: httpx.AsyncClient, sub: str, q: str, limit: int) -> List[Event]:
    url = f"{BASE}/r/{sub}/search.json"
    params = {
        "q": q,
        "sort": "new",
        "t": "day",
        "restrict_sr": "1",
        "limit": str(min(limit, 100)),
    }
    r = await client.get(url, params=params, headers={"User-Agent": UA}, timeout=20)
    r.raise_for_status()
    data = r.json()
    out: List[Event] = []
    for ch in data.get("data", {}).get("children", []):
        d = ch.get("data", {})
        title = d.get("title") or ""
        body = d.get("selftext") or ""
        txt = clean_text(f"{title}\n\n{body}")
        if not txt:
            continue
        permalink = d.get("permalink") or ""
        if permalink and permalink.startswith("/"):
            permalink = f"{BASE}{permalink}"
        ts = to_iso(d.get("created_utc") or datetime.now(tz=timezone.utc).timestamp())
        out.append(Event(text=txt, permalink=permalink, source="reddit", ts=ts))
    return out


async def fetch(cfg: Dict, phrases_cfg: Dict) -> List[Event]:
    subs: List[str] = cfg.get("subs", [])
    query_keys: List[str] = cfg.get("queries", ["generic", "verticals"])  # keys into phrases.yaml
    limit: int = int(cfg.get("limit", 25))

    # Build OR query: (generic) OR (verticals)
    generic = phrases_cfg.get("phrases", {}).get("generic", [])
    verticals = phrases_cfg.get("verticals", [])
    lex = phrases_cfg.get("lex", {}) or {}
    drop_title_patterns = lex.get(
        "drop_title_patterns",
        [
            r"\bmegathread\b",
            r"\bweekly\b",
            r"who'?s\s+hiring",  # avoid generic hiring threads
            r"hiring\s+thread",
            r"release\s+notes?",
            r"newsletter",
            r"changelog",
            r"announc(e|ement|ing)",
        ],
    )
    _DROP_RES = [re.compile(pat, re.I) for pat in drop_title_patterns]

    gq = " OR ".join([f'"{g}"' if " " in g else g for g in generic])
    vq = " OR ".join(verticals)

    if gq and vq:
        q = f"({gq}) OR ({vq})"
    else:
        q = gq or vq or ""

    results: List[Event] = []
    async with httpx.AsyncClient() as client:
        tasks = [
            _fetch_sub_query(client, sub, q, limit)
            for sub in subs
        ]
        for coro in asyncio.as_completed(tasks):
            try:
                part = await coro
                # Drop obvious non-demand threads by title
                for ev in part:
                    title = (ev.text or "").split("\n", 1)[0]
                    if any(p.search(title) for p in _DROP_RES):
                        continue
                    results.append(ev)
            except Exception:
                # Ignore failing sub to keep pipeline moving
                continue
    # Dedupe in-memory
    seen = set()
    deduped: List[Event] = []
    for e in results:
        h = dedupe_hash(e.text, e.permalink)
        if h in seen:
            continue
        seen.add(h)
        deduped.append(e)
    return deduped[: limit * max(1, len(subs))]
