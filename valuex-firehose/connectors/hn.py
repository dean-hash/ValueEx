from __future__ import annotations

from datetime import datetime, timezone
from typing import Dict, List

import httpx

from .base import Event, clean_text, dedupe_hash, to_iso, get_drop_title_res

ALGOLIA_URL = "https://hn.algolia.com/api/v1/search_by_date"


async def fetch(cfg: Dict, phrases_cfg: Dict) -> List[Event]:
    queries: List[str] = cfg.get("queries", [])
    tags: List[str] = cfg.get("tags", ["story"])  # e.g., ["story", "ask_hn"]
    limit: int = int(cfg.get("limit", 50))
    _DROP_RES = get_drop_title_res(phrases_cfg)

    results: List[Event] = []
    async with httpx.AsyncClient(timeout=20) as client:
        for tag in tags:
            for q in queries:
                try:
                    params = {
                        "query": q,
                        "tags": tag,
                        "hitsPerPage": str(limit),
                        "page": "0",
                    }
                    r = await client.get(ALGOLIA_URL, params=params)
                    r.raise_for_status()
                    data = r.json()
                    for hit in data.get("hits", []):
                        title = hit.get("title") or ""
                        story_text = hit.get("story_text") or ""
                        # Drop obvious non-demand threads by title
                        if title and any(p.search(title) for p in _DROP_RES):
                            continue
                        text = clean_text(f"{title}\n\n{story_text}")
                        if not text:
                            continue
                        obj_id = hit.get("objectID") or ""
                        url = f"https://news.ycombinator.com/item?id={obj_id}" if obj_id else (hit.get("url") or "")
                        ts = to_iso(hit.get("created_at") or datetime.now(tz=timezone.utc))
                        results.append(Event(text=text, permalink=url, source="hn", ts=ts))
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
    return out[:limit]
