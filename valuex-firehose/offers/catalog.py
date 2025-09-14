# offers/catalog.py
from __future__ import annotations

import os
import time
import re
from typing import Any, Dict, List, Tuple, Iterable
from datetime import datetime, timezone

import yaml
from offers.awin import is_joined_merchant

__all__ = [
    "load_offers",
    "refresh_offers",
    "get_offers",
    "top_matches",
    "match_offers",
    "__version__",
]
__version__ = "0.1.0"

_OFFERS_CACHE: List[Dict[str, Any]] = []
_OFFERS_MTIME: float = 0.0
_OFFERS_LAST_LOAD: float = 0.0


def _offers_path() -> str:
    return os.environ.get("OFFERS_YAML", os.path.join("config", "offers.yaml"))


def load_offers(path: str | None = None) -> List[Dict[str, Any]]:
    path = path or _offers_path()
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f) or []
    # Normalize fields
    norm: List[Dict[str, Any]] = []
    for o in data:
        if not isinstance(o, dict):
            continue
        o = dict(o)
        o.setdefault("id", "")
        o.setdefault("merchant", "")
        o.setdefault("epc_est", 0.5)
        o.setdefault("deep_link_ok", True)
        o.setdefault("categories", [])
        o.setdefault("angles", [])
        o.setdefault("landing_urls", [])
        # Optional fields for link construction/overrides
        o.setdefault("tracking_url", "")
        o.setdefault("awinmid", "")
        o.setdefault("constraints", {})
        norm.append(o)
    return norm


def refresh_offers() -> None:
    global _OFFERS_CACHE, _OFFERS_MTIME, _OFFERS_LAST_LOAD
    path = _offers_path()
    now = time.time()
    try:
        mtime = os.path.getmtime(path)
    except OSError:
        _OFFERS_CACHE, _OFFERS_MTIME = [], 0.0
        return
    if (mtime != _OFFERS_MTIME) or (now - _OFFERS_LAST_LOAD > 60):
        _OFFERS_CACHE = load_offers(path)
        _OFFERS_MTIME = mtime
        _OFFERS_LAST_LOAD = now


def get_offers() -> List[Dict[str, Any]]:
    refresh_offers()
    return _OFFERS_CACHE


_CHANNEL_MAP = {
    "x": "social",
    "twitter": "social",
    "hn": "forums",
    "reddit": "forums",
    "stackoverflow": "forums",
    "github": "forums",
    "rss": "content",
}


def _channel_for_source(source: str | None) -> str:
    if not source:
        return "content"
    return _CHANNEL_MAP.get(source.lower(), "content")


def _angle_from_text(text: str) -> str:
    t = text.lower()
    if re.search(r"\b(breach|security|compliance|audit)\b", t):
        return "security-pain"
    if re.search(r"\b(budget|cost|price|save|savings)\b", t):
        return "cost-cutting"
    if re.search(r"\b(deadline|asap|blocked|outage|now|urgent)\b", t):
        return "urgent-fix"
    return "productivity/velocity"


def _jaccard(a: Iterable[str], b: Iterable[str]) -> float:
    A = {*(x.lower() for x in (a or []))}
    B = {*(x.lower() for x in (b or []))}
    if not A and not B:
        return 0.0
    inter = len(A & B)
    union = len(A | B)
    return inter / union if union else 0.0


def _kw_match_score(text: str, cats: Iterable[str]) -> float:
    t = text.lower()
    hits = 0
    seen = set()
    for c in (cats or []):
        for tok in re.split(r"[^a-z0-9]+", str(c).lower()):
            tok = tok.strip()
            # Ignore empty or very short tokens (e.g., "it") to avoid spurious matches
            if not tok or len(tok) < 4:
                continue
            if tok in seen:
                continue
            # Word-boundary match; allow simple pluralization (s/es)
            if re.search(rf"\b{re.escape(tok)}(es|s)?\b", t):
                hits += 1
                seen.add(tok)
    return min(1.0, hits / 5.0)


def _epc_rank_norm(offers: List[Dict[str, Any]], epc: float) -> float:
    vals = [float(o.get("epc_est", 0.0)) for o in offers if isinstance(o, dict)]
    if not vals:
        return 0.0
    lo, hi = min(vals), max(vals)
    if hi <= lo:
        return 0.0
    return (float(epc) - lo) / (hi - lo)


def _constraints_ok(offer: Dict[str, Any], source: str | None) -> bool:
    cons = offer.get("constraints") or {}
    chans = set(map(str.lower, cons.get("channels", []) or []))
    if chans:
        ch = _channel_for_source(source)
        if ch not in chans:
            return False
    # Geo constraints: if present and not Global, we cannot verify. Accept only if Global.
    geos = set(map(str.upper, cons.get("geo", []) or []))
    if geos and ("GLOBAL" not in geos):
        return False
    return True


def _parse_dt(s: str | None):
    if not s:
        return None
    ss = str(s).strip()
    # Support trailing 'Z'
    if ss.endswith("Z"):
        ss = ss[:-1] + "+00:00"
    try:
        dt = datetime.fromisoformat(ss)
        # Make timezone-aware
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)
    except Exception:
        return None


def _offer_active(offer: Dict[str, Any]) -> bool:
    now = datetime.now(timezone.utc)
    vfrom = _parse_dt(offer.get("valid_from"))
    vto = _parse_dt(offer.get("valid_to"))
    status = str(offer.get("status") or "").lower()
    if vfrom and now < vfrom:
        return False
    if vto and now > vto:
        return False
    if status in {"paused", "inactive", "expired", "closed"}:
        return False
    return True


def top_matches(*, text: str, labels: List[str], topics: List[str], k: int = 3, source: str | None = None) -> List[Dict[str, Any]]:
    offers = get_offers()
    if not offers:
        return []

    target_cats = {*(x.lower() for x in (labels or [])), *(x.lower() for x in (topics or []))}
    angle_tag = _angle_from_text(text or "")
    actionable_set = {"hire_freelancer", "comparison_or_buying", "repair_or_fix"}
    is_actionable = bool(set(map(str, labels)) & actionable_set)

    ranked: List[Dict[str, Any]] = []
    for o in offers:
        # Skip offers outside validity window or explicitly inactive
        if not _offer_active(o):
            continue
        if not _constraints_ok(o, source):
            continue
        # Monetization gating: only consider Fiverr direct, or AWIN-joined merchants
        merchant_name = str(o.get("merchant", ""))
        if merchant_name and merchant_name.lower() != "fiverr" and not is_joined_merchant(merchant_name):
            continue
        cats = [str(x).lower() for x in o.get("categories", [])]
        cat_overlap = _jaccard(cats, target_cats)
        kw_score = _kw_match_score(text or "", cats)
        angle_align = 1.0 if angle_tag in [str(a) for a in (o.get("angles") or [])] else 0.0
        epc = float(o.get("epc_est", 0.0))
        epc_rank = _epc_rank_norm(offers, epc)

        # Hard gating: require solid topical or strong keyword relevance.
        # If there is little/no topical overlap, only allow strong keyword matches on actionable posts.
        if cat_overlap < 0.12:
            if not (kw_score >= 0.6 and is_actionable):
                continue
        fit = 0.5 * cat_overlap + 0.2 * kw_score + 0.2 * angle_align + 0.1 * epc_rank
        fit = max(0.0, min(1.0, float(fit)))
        ranked.append({
            "offer_id": o.get("id", ""),
            "merchant": o.get("merchant", ""),
            "fit": round(fit, 3),
            "epc_est": epc,
            "cat_overlap": round(float(cat_overlap), 3),
            "kw_score": round(float(kw_score), 3),
            "url": (o.get("landing_urls") or [""])[0],
            "tracking_url": o.get("tracking_url", ""),
            "awinmid": o.get("awinmid", ""),
            "rationale": f"cats={cat_overlap:.2f}, kw={kw_score:.2f}, angle={angle_align:.2f}, epc_rank={epc_rank:.2f}",
        })

    # Sort primarily by topical fit; EPC as tiebreaker for monetization
    ranked.sort(key=lambda r: (r["fit"], r["epc_est"]), reverse=True)
    return ranked[:k]


def match_offers(event: Dict[str, Any], k: int = 3) -> List[Dict[str, Any]]:
    return top_matches(text=event.get("text", ""), labels=event.get("labels", []), topics=event.get("topics", []), k=k, source=event.get("source"))
