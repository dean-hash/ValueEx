from __future__ import annotations

import os
import re
from typing import List, Dict, Any
import time

import yaml
from fastapi import FastAPI
from pydantic import BaseModel
from offers.catalog import top_matches
from offers.linker import build_affiliate_url

ROOT = os.path.dirname(os.path.dirname(__file__))
CONFIG_PATH = os.path.join(ROOT, "config", "phrases.yaml")

with open(CONFIG_PATH, "r", encoding="utf-8") as f:
    PHRASES = yaml.safe_load(f)

VERTICALS: List[str] = PHRASES.get("verticals", [])
ACTIONABLE: List[str] = PHRASES.get("actionable_labels", [])

# Configurable lexicon with sensible defaults
LEX = PHRASES.get("lex", {}) or {}
REPAIR_WORDS = LEX.get(
    "repair_words",
    [
        "how do i",
        "fix",
        "won't start",
        "can't",
        "cannot",
        "error",
        "issue",
        "broken",
        "down",
        "site down",
        "server down",
        "troubleshoot",
        "stuck",
    ],
)
URGENT_WORDS = LEX.get(
    "urgent_words",
    ["urgent", "help", "asap", "now", "immediately", "please help", "help needed"],
)
HIRE_WORDS = LEX.get(
    "hire_words",
    [
        "need a developer",
        "looking for developer",
        "consultant",
        "paid project",
        "hire",
        "hiring",
        "freelancer",
        "budget",
        "quote",
        "estimate",
    ],
)
COMPARE_WORDS = LEX.get(
    "compare_words",
    [
        "alternatives to",
        "alternative to",
        "worth it",
        "compare",
        "recommendation",
        "recommendations",
        "best",
        "vs",
    ],
)
NEGATIVE_WORDS = set(
    LEX.get(
        "negative_words",
        [
            "release",
            "announcement",
            "announcing",
            "blog",
            "newsletter",
            "changelog",
            "hiring",
            "job",
            "position",
            "role",
            "apply",
        ],
    )
)

# Informational words that suggest a non-help-seeking, how-to, or promotional post
INFO_WORDS = LEX.get(
    "informational_words",
    [
        "how i set up",
        "how we built",
        "case study",
        "guide",
        "tutorial",
        "my setup",
        "walkthrough",
        "postmortem",
        "we built",
        "we launched",
        "launch post",
    ],
)

# Vertical aliases (e.g., wordpress -> [wp, elementor])
ALIASES: Dict[str, List[str]] = PHRASES.get("vertical_aliases", {}) or {}

VERT_PATTERNS: List[tuple[str, re.Pattern]] = []
for v in VERTICALS:
    terms = [v] + list(ALIASES.get(v, []) or [])
    for term in terms:
        VERT_PATTERNS.append((v, re.compile(rf"\b{re.escape(term)}\b", re.I)))


def detect_topics(text: str) -> List[str]:
    out: List[str] = []
    seen: set[str] = set()
    for v, pat in VERT_PATTERNS:
        if pat.search(text) and v not in seen:
            out.append(v)
            seen.add(v)
    return out[:5]


def detect_labels(text: str) -> List[str]:
    t = text.lower()
    labels: List[str] = []
    if any(w in t for w in REPAIR_WORDS):
        labels.append("repair_or_fix")
    if any(w in t for w in URGENT_WORDS):
        labels.append("urgent_service")
    if any(w in t for w in HIRE_WORDS):
        labels.append("hire_freelancer")
    if any(w in t for w in COMPARE_WORDS):
        labels.append("comparison_or_buying")
    return labels[:4]

def choose_offers(text: str, labels: List[str], topics: List[str]) -> List[Dict[str, Any]]:
    """Use catalog.top_matches() to select offers with EPC and constraints, while
    preserving the response shape expected by downstream consumers (affiliate_url, id).
    """
    matches: List[Dict[str, Any]] = []
    try:
        matches = top_matches(text=text, labels=labels, topics=topics, k=3, source="router") or []
    except Exception:
        matches = []

    offers: List[Dict[str, Any]] = []
    seen_ids: set[str] = set()
    for m in matches:
        oid = str(m.get("offer_id") or "")
        if not oid or oid in seen_ids:
            continue
        link = ""
        try:
            link = build_affiliate_url(m, labels=labels, topics=topics, source="router")
        except Exception:
            link = ""
        if not link:
            continue  # skip non-monetizable
        offers.append({
            "id": oid,
            "affiliate_url": link,
            "merchant": m.get("merchant"),
            "fit": m.get("fit"),
            "epc_est": m.get("epc_est"),
            "rationale": m.get("rationale"),
        })
        seen_ids.add(oid)

    # Fallback: if nothing monetizable matched, try Fiverr env link based on topic tier
    # Gate this by requiring actionable labels to be present to avoid low-signal matches.
    actionable_ok = any((l in (ACTIONABLE or [])) for l in (labels or []))
    if not offers and topics and actionable_ok:
        try:
            temp_match = {"offer_id": f"fiverr_{topics[0]}", "merchant": "Fiverr", "url": ""}
            link = build_affiliate_url(temp_match, labels=labels, topics=topics, source="router")
            if link:
                offers.append({
                    "id": temp_match["offer_id"],
                    "affiliate_url": link,
                })
        except Exception:
            pass
    return offers[:3]


class RouteIn(BaseModel):
    text: str


class RouteOut(BaseModel):
    score: float
    labels: List[str]
    topics: List[str]
    offers: List[Dict[str, Any]]
    explanation: Dict[str, Any]


app = FastAPI(title="ValueX MVP Router")

# Metrics router and instruments
try:
    from app.metrics import (
        router as metrics_router,
        route_requests_total,
        route_labels_generated_total,
        route_latency_seconds,
    )
    app.include_router(metrics_router)
except Exception:
    # Metrics are optional; app should continue without them
    metrics_router = None
    route_requests_total = None
    route_labels_generated_total = None
    route_latency_seconds = None

# Inbound/SNS router (optional)
try:
    from app.inbound import router as inbound_router
    app.include_router(inbound_router)
except Exception:
    inbound_router = None


@app.post("/route", response_model=RouteOut)
async def route(inp: RouteIn) -> RouteOut:
    _start = time.monotonic()
    _status = "200"
    text = inp.text or ""
    labels = detect_labels(text)
    topics = detect_topics(text)

    # Tuned scoring: prioritize actionable help/break-fix, boost when topic present,
    # and suppress obvious non-demand content (releases, newsletters, hiring posts, informational write-ups).
    # Build explainable scoring
    score = 0.05
    components: Dict[str, float] = {}
    if "repair_or_fix" in labels:
        components["repair_or_fix"] = components.get("repair_or_fix", 0.0) + 0.25
        score += 0.25
    if "urgent_service" in labels:
        components["urgent_service"] = components.get("urgent_service", 0.0) + 0.2
        score += 0.2
    if "hire_freelancer" in labels:
        components["hire_freelancer"] = components.get("hire_freelancer", 0.0) + 0.2
        score += 0.2
    if "comparison_or_buying" in labels:
        components["comparison_or_buying"] = components.get("comparison_or_buying", 0.0) + 0.1
        score += 0.1
    if topics:
        components["topic_present"] = components.get("topic_present", 0.0) + 0.2
        score += 0.2
    if labels and topics:
        components["label_topic_combo"] = components.get("label_topic_combo", 0.0) + 0.05
        score += 0.05

    t = text.lower()
    negative_hits = [w for w in NEGATIVE_WORDS if w in t]
    if negative_hits:
        components["negative_words"] = components.get("negative_words", 0.0) - 0.25
        score -= 0.25

    # Additional penalty for informational write-ups that are unlikely to be requests
    info_hits = [w for w in INFO_WORDS if w in t]
    if info_hits:
        components["informational_words"] = components.get("informational_words", 0.0) - 0.15
        score -= 0.15

    score = max(0.0, min(1.0, score))

    offers = choose_offers(text, labels, topics)

    # Constrain to actionable labels subset
    labels = [l for l in labels if (not ACTIONABLE) or (l in ACTIONABLE)]

    # Build explanation payload
    def _hits(words: List[str]) -> List[str]:
        tl = t
        return [w for w in words if w in tl]

    explanation = {
        "hits": {
            "repair_or_fix": _hits(REPAIR_WORDS),
            "urgent_service": _hits(URGENT_WORDS),
            "hire_freelancer": _hits(HIRE_WORDS),
            "comparison_or_buying": _hits(COMPARE_WORDS),
            "negative_words": negative_hits,
            "informational_words": _hits(INFO_WORDS),
        },
        "topics": topics,
        "score_components": components,
    }

    try:
        out = RouteOut(score=score, labels=labels, topics=topics, offers=offers, explanation=explanation)
        # Metrics
        if route_labels_generated_total is not None:
            try:
                route_labels_generated_total.inc(len(labels or []))
            except Exception:
                pass
        return out
    except Exception:
        _status = "500"
        raise
    finally:
        if route_latency_seconds is not None:
            try:
                route_latency_seconds.observe(max(0.0, time.monotonic() - _start))
            except Exception:
                pass
        if route_requests_total is not None:
            try:
                route_requests_total.labels(path="/route", status=_status).inc()
            except Exception:
                pass


@app.get("/health")
async def health() -> Dict[str, Any]:
    return {
        "status": "ok",
        "verticals": len(VERTICALS),
        "actionable_labels": ACTIONABLE,
        "lex_counts": {
            "repair_words": len(REPAIR_WORDS or []),
            "urgent_words": len(URGENT_WORDS or []),
            "hire_words": len(HIRE_WORDS or []),
            "compare_words": len(COMPARE_WORDS or []),
            "negative_words": len(NEGATIVE_WORDS or []),
        },
    }
