from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from typing import Dict, List

import httpx

from .base import Event, clean_text, dedupe_hash, to_iso, get_drop_title_res

SEARCH_API = "https://api.github.com/search/issues"


async def _search_repo(client: httpx.AsyncClient, repo: str, query_terms: List[str], since_iso_date: str, limit: int, open_only: bool, _DROP_RES) -> List[Event]:
    # Build search query. Example:
    # q=repo:owner/name is:issue is:open created:>=2025-08-22 (error OR fix OR cannot OR "won't")
    terms = []
    for t in query_terms:
        if " " in t:
            terms.append(f'"{t}"')
        else:
            terms.append(t)
    or_block = " OR ".join(terms) if terms else ""
    q = f"repo:{repo} is:issue created:>={since_iso_date}"
    if open_only:
        q += " is:open"
    if or_block:
        q += f" ({or_block})"

    params = {
        "q": q,
        "sort": "created",
        "order": "desc",
        "per_page": str(min(limit, 100)),
        "page": "1",
    }
    r = await client.get(SEARCH_API, params=params)
    r.raise_for_status()
    data = r.json()
    events: List[Event] = []
    for item in data.get("items", []):
        title = item.get("title") or ""
        if title and any(p.search(title) for p in _DROP_RES):
            continue
        body = item.get("body") or ""
        url = item.get("html_url") or ""
        text = clean_text(f"{title}\n\n{body[:400]}")
        if not text:
            continue
        ts = to_iso(item.get("created_at") or datetime.now(tz=timezone.utc))
        events.append(Event(text=text, permalink=url, source="github", ts=ts))
    return events


async def fetch(cfg: Dict, phrases_cfg: Dict) -> List[Event]:
    repos: List[str] = cfg.get("repos", [])
    queries: List[str] = cfg.get("queries", [])
    window_h: int = int(cfg.get("window_hours", 48))
    limit: int = int(cfg.get("limit", 25))
    open_only: bool = bool(cfg.get("open_only", True))

    since_dt = datetime.now(tz=timezone.utc) - timedelta(hours=window_h)
    since_iso_date = since_dt.strftime("%Y-%m-%d")

    headers = {"Accept": "application/vnd.github+json"}
    token = os.getenv("GITHUB_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"
        headers["X-GitHub-Api-Version"] = "2022-11-28"

    out: List[Event] = []
    _DROP_RES = get_drop_title_res(phrases_cfg)
    async with httpx.AsyncClient(headers=headers, timeout=20) as client:
        for repo in repos:
            try:
                part = await _search_repo(client, repo, queries, since_iso_date, limit, open_only, _DROP_RES)
                out.extend(part)
            except Exception:
                continue

    # Dedupe
    seen = set()
    deduped: List[Event] = []
    for e in out:
        h = dedupe_hash(e.text, e.permalink)
        if h in seen:
            continue
        seen.add(h)
        deduped.append(e)
    return deduped
