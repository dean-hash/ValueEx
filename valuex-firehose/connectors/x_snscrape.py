from __future__ import annotations

import asyncio
import json
import os
import subprocess
import sys
from datetime import datetime, timedelta, timezone
from typing import Dict, List

from .base import Event, clean_text, dedupe_hash, to_iso, get_drop_title_res


def _build_query(phrases_cfg: Dict, cfg: Dict) -> str:
    generic = phrases_cfg.get("phrases", {}).get("generic", [])
    developer = phrases_cfg.get("phrases", {}).get("developer", [])
    verticals = phrases_cfg.get("verticals", []) or []
    aliases: Dict[str, List[str]] = phrases_cfg.get("vertical_aliases", {}) or {}

    vert_terms: List[str] = []
    for v in verticals:
        vert_terms.append(v)
        for a in aliases.get(v, []) or []:
            vert_terms.append(a)

    all_terms = generic + developer + vert_terms
    # OR join terms, quote multi-word
    parts = [f'"{t}"' if " " in t else t for t in all_terms]
    if not parts:
        return ""
    base = " OR ".join(parts)
    # Language and noise suppression
    return f"({base}) lang:en exclude:retweets exclude:replies"


def _parse_jsonl(stdout: str) -> List[Dict]:
    out: List[Dict] = []
    for line in (stdout or "").splitlines():
        try:
            out.append(json.loads(line))
        except Exception:
            continue
    return out


def _run_snscrape(query: str, max_results: int) -> List[Dict]:
    # Try CLI first
    args_cli = [
        "snscrape", "--jsonl", "--max-results", str(int(max_results)), "twitter-search", query
    ]
    try:
        proc = subprocess.run(args_cli, shell=False, capture_output=True, text=True, encoding="utf-8", errors="ignore")
        if proc.returncode == 0 and proc.stdout:
            return _parse_jsonl(proc.stdout)
    except Exception:
        pass

    # Fallback to python -m snscrape using current interpreter (best for Windows PATH issues)
    py = sys.executable or "python"
    args_py = [
        py, "-m", "snscrape", "--jsonl", "--max-results", str(int(max_results)), "twitter-search", query
    ]
    proc = subprocess.run(args_py, shell=False, capture_output=True, text=True, encoding="utf-8", errors="ignore")
    if proc.returncode != 0 or not proc.stdout:
        return []
    return _parse_jsonl(proc.stdout)


async def fetch(cfg: Dict, phrases_cfg: Dict) -> List[Event]:
    query = _build_query(phrases_cfg, cfg)
    max_results = int(cfg.get("max_results", 50))
    window_h = int(cfg.get("window_hours", 24))
    since_dt = datetime.now(tz=timezone.utc) - timedelta(hours=window_h)

    # Run sync in thread
    rows = await asyncio.to_thread(_run_snscrape, query, max_results)

    events: List[Event] = []
    _DROP_RES = get_drop_title_res(phrases_cfg)
    for r in rows:
        raw = r.get("content") or ""
        if raw and any(p.search(raw) for p in _DROP_RES):
            continue
        txt = clean_text(raw)
        if not txt:
            continue
        dt = r.get("date")
        try:
            # Example: 2025-08-22T15:00:00+00:00
            dt_parsed = datetime.fromisoformat(dt.replace("Z", "+00:00")) if isinstance(dt, str) else None
        except Exception:
            dt_parsed = None
        if dt_parsed and dt_parsed < since_dt:
            continue
        url = r.get("url") or ""
        events.append(Event(text=txt, permalink=url, source="x", ts=to_iso(dt_parsed or datetime.now(tz=timezone.utc))))

    # Dedupe
    seen = set()
    out: List[Event] = []
    for e in events:
        h = dedupe_hash(e.text, e.permalink)
        if h in seen:
            continue
        seen.add(h)
        out.append(e)
    return out
