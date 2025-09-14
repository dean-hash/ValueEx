from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Dict, List

import httpx

from .base import Event, clean_text, dedupe_hash, to_iso, get_drop_title_res

API = "https://api.stackexchange.com/2.3/search/advanced"


async def fetch(cfg: Dict, phrases_cfg: Dict) -> List[Event]:
    tags: List[str] = cfg.get("tags", [])
    window_h: int = int(cfg.get("window_hours", 48))
    unanswered_only: bool = bool(cfg.get("unanswered_only", False))
    since = int((datetime.now(tz=timezone.utc) - timedelta(hours=window_h)).timestamp())

    results: List[Event] = []
    _DROP_RES = get_drop_title_res(phrases_cfg)
    async with httpx.AsyncClient(timeout=20) as client:
        for tag in tags:
            params = {
                "order": "desc",
                "sort": "creation",
                "tagged": tag,
                "site": "stackoverflow",
                "pagesize": "30",
                "fromdate": str(since),
                "min": "0",  # score >= 0
            }
            try:
                r = await client.get(API, params=params)
                r.raise_for_status()
                data = r.json()
                for item in data.get("items", []):
                    if unanswered_only and item.get("is_answered", False):
                        continue
                    title = item.get("title") or ""
                    if title and any(p.search(title) for p in _DROP_RES):
                        continue
                    excerpt = item.get("body_markdown") or item.get("excerpt") or ""
                    link = item.get("link") or ""
                    score = item.get("score", 0)
                    answers = item.get("answer_count", 0)
                    is_answered = item.get("is_answered", False)
                    meta = f"[score={score}, answers={answers}, answered={is_answered}]"
                    text = clean_text(f"{title}\n\n{excerpt}\n\n{meta}")
                    if not text:
                        continue
                    ts = to_iso(item.get("creation_date") or datetime.now(tz=timezone.utc).timestamp())
                    results.append(Event(text=text, permalink=link, source="stackoverflow", ts=ts))
            except Exception:
                continue
    # Dedupe
    seen = set()
    out: List[Event] = []
    for e in results:
        h = dedupe_hash(e.text, e.permalink)
        if h in seen:
            continue
        seen.add(h)
        out.append(e)
    return out
