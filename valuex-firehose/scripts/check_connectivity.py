#!/usr/bin/env python
from __future__ import annotations

import asyncio
import json
import os
import sys
from pathlib import Path

import httpx
import yaml
from dotenv import load_dotenv

# Make repo root importable
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
# Layered env: workspace defaults then project overrides
WORKSPACE = ROOT.parent
load_dotenv(WORKSPACE / ".env")
load_dotenv(ROOT / ".env", override=True)

# Connectors
from connectors import reddit as cx_reddit
from connectors import x_snscrape as cx_x
from connectors import hn as cx_hn
from connectors import stackoverflow as cx_so
from connectors import github as cx_gh
from connectors import rss as cx_rss


def _load_yaml(path: Path):
    try:
        return yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    except Exception:
        return {}


async def _safe(name: str, coro):
    try:
        evs = await coro
        return {"ok": True, "count": len(evs), "sample": (evs[0].permalink if evs else "")[:160]}
    except Exception as e:
        return {"ok": False, "error": f"{type(e).__name__}: {e}"[:200]}


async def main():
    phrases = _load_yaml(ROOT / "config" / "phrases.yaml")
    sources = _load_yaml(ROOT / "config" / "sources.yaml")

    out = {}

    # Reddit
    rd_cfg = dict(sources.get("reddit") or {})
    rd_cfg["subs"] = (rd_cfg.get("subs") or [])[:3]
    rd_cfg["limit"] = 5
    out["reddit"] = await _safe("reddit", cx_reddit.fetch(rd_cfg, phrases))

    # X via snscrape
    x_cfg = dict(sources.get("x") or {})
    x_cfg["max_results"] = min(20, int(x_cfg.get("max_results", 50)))
    x_cfg["window_hours"] = int(x_cfg.get("window_hours", 24))
    out["x"] = await _safe("x", cx_x.fetch(x_cfg, phrases))

    # Hacker News
    hn_cfg = dict(sources.get("hn") or {})
    hn_cfg["limit"] = min(5, int(hn_cfg.get("limit", 50)))
    out["hn"] = await _safe("hn", cx_hn.fetch(hn_cfg, phrases))

    # StackOverflow
    so_cfg = dict(sources.get("stackoverflow") or {})
    so_cfg["tags"] = (so_cfg.get("tags") or [])[:5]
    out["stackoverflow"] = await _safe("stackoverflow", cx_so.fetch(so_cfg, phrases))

    # GitHub
    gh_cfg = dict(sources.get("github") or {})
    gh_cfg["repos"] = (gh_cfg.get("repos") or [])[:3]
    gh_cfg["limit"] = min(10, int(gh_cfg.get("limit", 25)))
    out["github"] = await _safe("github", cx_gh.fetch(gh_cfg, phrases))

    # RSS
    rss_cfg = dict(sources.get("rss") or {})
    rss_cfg["feeds"] = (rss_cfg.get("feeds") or [])[:3]
    rss_cfg["limit"] = min(10, int(rss_cfg.get("limit", 50)))
    out["rss"] = await _safe("rss", cx_rss.fetch(rss_cfg, phrases))

    # Optional: metrics endpoint if app is running
    route_api = os.getenv("ROUTE_API", "http://127.0.0.1:8000")
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.get(f"{route_api}/metrics")
            out["metrics_endpoint"] = {"ok": r.status_code == 200, "status": r.status_code}
    except Exception as e:
        out["metrics_endpoint"] = {"ok": False, "error": str(e)[:200]}

    print(json.dumps(out, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
