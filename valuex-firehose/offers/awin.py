# offers/awin.py
from __future__ import annotations

import os
import time
from typing import Dict, Tuple, List

import httpx

__all__ = [
    "get_joined_programmes",
    "get_programmes",
    "is_joined_merchant",
    "get_primary_publisher_id",
    "normalize_merchant_name",
]

# Simple in-process cache
_AWIN_CACHE: Dict[str, object] = {
    "last_fetch": 0.0,
    "by_norm_name": {},  # norm_name -> (advertiser_id, display_name)
    "advertisers": [],   # raw list
    "pid": None,
}
_AWIN_TTL_SECONDS = float(os.getenv("AWIN_CACHE_TTL", "1800"))  # 30 min default


def _debug(msg: str) -> None:
    if os.getenv("AWIN_DEBUG"):
        try:
            print(f"[AWIN] {msg}")
        except Exception:
            pass


def _normalize_name(s: str | None) -> str:
    if not s:
        return ""
    s = s.strip().lower()
    # collapse non-alnum
    return "".join(ch for ch in s if ch.isalnum())


def normalize_merchant_name(s: str | None) -> str:
    """Public helper to normalize AWIN merchant/advertiser names consistently.

    Collapses to lowercase alphanumeric only (same as _normalize_name).
    """
    return _normalize_name(s)


def get_primary_publisher_id() -> str:
    pid = os.getenv("AWIN_PRIMARY_PUBLISHER_ID") or ""
    if not pid:
        pids = [x.strip() for x in (os.getenv("AWIN_PUBLISHER_IDS") or "").split(",") if x.strip()]
        pid = pids[0] if pids else ""
    return str(pid)


def _fetch_programmes_page(client: httpx.Client, pid: str, relationship: str, page: int, page_size: int = 200) -> List[dict]:
    token = os.getenv("AWIN_API_KEY") or os.getenv("AWIN_API_TOKEN") or ""
    if not token or not pid:
        return []
    url = f"https://api.awin.com/publishers/{pid}/programmes"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
    }
    params = {"relationship": relationship, "page": str(page), "pageSize": str(page_size)}
    _debug(f"GET {url} params={params}")
    r = client.get(
        url,
        headers=headers,
        params=params,
        timeout=20,
    )
    if r.status_code != 200:
        _debug(f"HTTP {r.status_code} - {r.text[:500]}")
        r.raise_for_status()
    data = r.json()
    # API responses vary; try best-effort extraction
    items = data.get("data") if isinstance(data, dict) else None
    if not items and isinstance(data, dict):
        # Common alternatives seen across AWIN payloads
        for key in ("programmes", "programs", "items", "content", "results", "list"):
            v = data.get(key)
            if isinstance(v, list):
                items = v
                break
    if not items:
        items = data
    if not isinstance(items, list):
        _debug(f"Unexpected payload shape keys={list(data.keys()) if isinstance(data, dict) else type(data)}")
        return []
    return items


def get_joined_programmes(force: bool = False) -> Tuple[Dict[str, Tuple[str, str]], List[dict]]:
    """
    Returns (by_norm_name, raw_list)
      - by_norm_name: { normalized_advertiser_name: (advertiser_id, display_name) }
    """
    now = time.time()
    pid = get_primary_publisher_id()
    last_fetch = float(_AWIN_CACHE.get("last_fetch") or 0.0)
    if (not force) and _AWIN_CACHE.get("by_norm_name") and (now - last_fetch < _AWIN_TTL_SECONDS) and _AWIN_CACHE.get("pid") == pid:
        return _AWIN_CACHE["by_norm_name"], _AWIN_CACHE["advertisers"]  # type: ignore

    by_norm: Dict[str, Tuple[str, str]] = {}
    advertisers: List[dict] = []
    if pid:
        try:
            with httpx.Client() as client:
                # First page
                page1 = _fetch_programmes_page(client, pid, relationship="joined", page=1)
                advertisers.extend(page1 or [])
                # If many partners, optionally fetch page 2 (best-effort)
                if len(page1 or []) >= 500:
                    try:
                        page2 = _fetch_programmes_page(client, pid, relationship="joined", page=2)
                        advertisers.extend(page2 or [])
                    except Exception:
                        _debug("Error fetching page 2 for joined; continuing")
        except Exception as e:
            # Network/API errors -> empty list
            _debug(f"Error fetching joined programmes: {e}")
            advertisers = []

    for it in advertisers:
        name = (
            it.get("advertiserName")
            or it.get("name")
            or (it.get("advertiser") or {}).get("name")
            or ""
        )
        adv_id = str(
            it.get("advertiserId")
            or it.get("id")
            or (it.get("advertiser") or {}).get("id")
            or ""
        )
        norm = _normalize_name(name)
        if norm and adv_id:
            by_norm[norm] = (adv_id, name)

    _AWIN_CACHE.update({
        "last_fetch": now,
        "by_norm_name": by_norm,
        "advertisers": advertisers,
        "pid": pid,
    })
    return by_norm, advertisers


def is_joined_merchant(merchant_name: str | None) -> bool:
    if not merchant_name:
        return False
    by_norm, _ = get_joined_programmes(force=False)
    norm = _normalize_name(merchant_name)
    return norm in by_norm


def get_programmes(relationship: str = "joined", *, force: bool = False) -> List[dict]:
    """Return raw programmes for a relationship (joined, pending, notjoined, rejected, suspended)."""
    pid = get_primary_publisher_id()
    if not pid:
        return []
    # For now, ignore cache for non-joined (cheap enough + simplicity)
    try:
        with httpx.Client() as client:
            page1 = _fetch_programmes_page(client, pid, relationship=relationship, page=1)
            items = list(page1 or [])
            if len(page1 or []) >= 500:
                try:
                    page2 = _fetch_programmes_page(client, pid, relationship=relationship, page=2)
                    items.extend(page2 or [])
                except Exception as e:
                    _debug(f"Error fetching page 2 for relationship={relationship}: {e}")
            return items
    except Exception as e:
        _debug(f"Error fetching programmes relationship={relationship}: {e}")
        return []
