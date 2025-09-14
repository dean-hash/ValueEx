from __future__ import annotations

from datetime import datetime, timezone
from typing import Dict, List

import feedparser

from .base import Event, clean_text, dedupe_hash, to_iso, get_drop_title_res


def _match_phrases(text: str, phrases_cfg: Dict) -> bool:
    t = text.lower()
    generic = phrases_cfg.get("phrases", {}).get("generic", [])
    developer = phrases_cfg.get("phrases", {}).get("developer", [])
    verticals = phrases_cfg.get("verticals", []) or []
    aliases: Dict[str, List[str]] = phrases_cfg.get("vertical_aliases", {}) or {}
    vert_terms: List[str] = []
    for v in verticals:
        vert_terms.append(v)
        for a in aliases.get(v, []) or []:
            vert_terms.append(a)
    terms = list(generic) + list(developer) + vert_terms
    return any((term or "").lower() in t for term in terms)


def fetch_sync(cfg: Dict, phrases_cfg: Dict) -> List[Event]:
    feeds: List[str] = cfg.get("feeds", [])
    limit: int = int(cfg.get("limit", 50))

    out: List[Event] = []
    _DROP_RES = get_drop_title_res(phrases_cfg)
    for url in feeds:
        try:
            fp = feedparser.parse(url)
        except Exception:
            continue
        for e in fp.entries[:limit]:
            title = e.get("title", "")
            if title and any(p.search(title) for p in _DROP_RES):
                continue
            summary = e.get("summary", "")
            link = e.get("link", "")
            txt = clean_text(f"{title}\n\n{summary}")
            if not txt:
                continue
            if not _match_phrases(txt, phrases_cfg):
                continue
            # Try date
            published = (
                getattr(e, "published", None)
                or getattr(e, "updated", None)
                or getattr(e, "created", None)
            )
            ts = to_iso(published or datetime.now(tz=timezone.utc))
            out.append(Event(text=txt, permalink=link, source="rss", ts=ts))
    # Dedupe
    seen = set()
    deduped: List[Event] = []
    for ev in out:
        h = dedupe_hash(ev.text, ev.permalink)
        if h in seen:
            continue
        seen.add(h)
        deduped.append(ev)
    return deduped


async def fetch(cfg: Dict, phrases_cfg: Dict) -> List[Event]:
    # feedparser is sync; run in thread
    from asyncio import to_thread

    return await to_thread(fetch_sync, cfg, phrases_cfg)
