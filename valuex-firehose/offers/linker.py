# offers/linker.py
from __future__ import annotations

import os
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urlencode, urlparse, parse_qsl, urlunparse, quote

import yaml
from valuex_common.url import with_query as _with_query_common

from .awin import get_joined_programmes, get_primary_publisher_id, normalize_merchant_name
from linker.builder import (
    build_fiverr_link as _build_fiverr_link_invariant,
    is_awin_tracking_url as _is_awin_tracking_url,
    append_awin_clickref as _append_awin_clickref,
    build_awin_link as _build_awin_link_invariant,
)

__all__ = [
    "build_affiliate_url",
]

# Cache affiliate_map.yaml
_AFFMAP: Optional[dict] = None
_AFFMAP_PATHS = [
    Path(__file__).resolve().parents[2] / "resonance" / "config" / "affiliate_map.yaml",
    Path(__file__).resolve().parents[1] / "config" / "affiliate_map.yaml",
]


def _load_affmap() -> dict:
    global _AFFMAP
    if _AFFMAP is not None:
        return _AFFMAP
    for p in _AFFMAP_PATHS:
        try:
            if p.exists():
                _AFFMAP = yaml.safe_load(p.read_text(encoding="utf-8")) or {}
                return _AFFMAP
        except Exception:
            pass
    _AFFMAP = {}
    return _AFFMAP


def _choose_fiverr_tier(topics: List[str]) -> str:
    aff = _load_affmap()
    fm = (aff.get("fiverr") or {}).get("map") or {}
    default = ((aff.get("fiverr") or {}).get("default") or "MARKETPLACE").upper()
    for t in topics or []:
        tag = str(fm.get(str(t).lower()) or "").upper()
        if tag in ("MARKETPLACE", "PRO", "LOGOMAKER"):
            return tag
    return default


def _with_query(url: str, params: Dict[str, str]) -> str:
    """Backward-compatible wrapper delegating to shared helper."""
    return _with_query_common(url, params)


def _build_awin_link(dest_url: str, merchant_name: str, subid: str | None = None, awinmid_override: str | None = None) -> str:
    # Delegate to invariant-preserving builder; it will verify membership as needed
    return _build_awin_link_invariant(
        dest_url,
        merchant_name,
        clickref=(subid[:120] if subid else None),
        awinmid=(awinmid_override or None),
        publisher_id=None,
    )


def _build_fiverr_link(topics: List[str], subid: str | None = None) -> str:
    tier = _choose_fiverr_tier(topics)
    env_key = {
        "MARKETPLACE": "FIVERR_LINK_MARKETPLACE",
        "PRO": "FIVERR_LINK_PRO",
        "LOGOMAKER": "FIVERR_LINK_LOGOMAKER",
    }.get(tier, "FIVERR_LINK_MARKETPLACE")
    base = os.getenv(env_key) or ""
    if not base:
        return ""
    # Enforce single-source mutation via builder: only append 'afp' when missing
    if subid:
        return _build_fiverr_link_invariant(base, subid[:120])
    return base


def build_affiliate_url(
    match: Dict[str, Any],
    *,
    labels: Optional[List[str]] = None,
    topics: Optional[List[str]] = None,
    source: Optional[str] = None,
    subid_prefix: Optional[str] = None,
) -> str:
    """
    Returns monetizable affiliate URL for a match or empty string if not monetizable.
    - For Fiverr: uses env base link per affiliate_map.yaml tier; appends subId.
    - For AWIN: requires joined programme; builds cread.php link with publisher id and clickref.
    """
    merchant = (match.get("merchant") or "").strip()
    dest = match.get("url") or ""
    offer_id = match.get("offer_id") or ""
    tracking_url = (match.get("tracking_url") or "").strip()
    awinmid_override = (match.get("awinmid") or "").strip()

    # Construct subid
    prefix = subid_prefix or os.getenv("SUBID_PREFIX") or os.getenv("FIVERR_SUBID_PREFIX") or "VX"
    src = (source or "").strip() or "router"
    topic_tag = (topics or [""])[0] if topics else ""
    subid = f"{prefix}:{src}:{offer_id or topic_tag}".strip(":")

    # Fiverr: direct partner path
    if merchant.lower() == "fiverr":
        return _build_fiverr_link(topics or [], subid=subid)

    # If a prebuilt tracking URL is provided and appears to be an AWIN link, append clickref and return
    def _is_awin_tracking(url: str) -> bool:
        return _is_awin_tracking_url(url)

    if tracking_url and _is_awin_tracking(tracking_url):
        # Validate membership for prebuilt AWIN links
        by_norm, _ = get_joined_programmes(force=False)
        joined_ids = {str(v[0]) for v in by_norm.values() if isinstance(v, tuple) and v and v[0]}
        try:
            q = dict(parse_qsl(urlparse(tracking_url).query, keep_blank_values=True))
            mid = str(q.get("awinmid") or "").strip()
        except Exception:
            mid = ""
        # If awinmid is present in URL, ensure it is a joined advertiser id
        if mid and mid not in joined_ids:
            return ""
        # If awinmid not present, fall back to merchant name membership
        if (not mid) and normalize_merchant_name(merchant) not in by_norm:
            return ""
        # Append clickref strictly via builder to preserve invariants
        return _append_awin_clickref(tracking_url, subid[:120] if subid else None)

    # AWIN constructed deep link for other merchants
    awin_url = _build_awin_link(dest, merchant, subid=subid, awinmid_override=awinmid_override or None)
    return awin_url
