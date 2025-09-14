# demand/vectorizer.py
from __future__ import annotations

import math
import re
from datetime import datetime, timezone
from typing import Dict, Tuple, Iterable

__all__ = ["compute_demand", "__version__"]
__version__ = "0.1.0"

# Simple keyword sets (can be tuned via config later)
_PAIN_PAT = re.compile(r"\b(breach|security|pci|hipaa|downtime|outage|blocked|incident|prod(uction)?\s+issue|error|fail(ed|ure)|crash|broken)\b", re.I)
_BUDGET_PAT = re.compile(r"\b(rfp|budget|pricing|price|quote|invoice|license|paid|purchase|vendor)\b", re.I)
_AUDIENCE_PAT = re.compile(r"\b(ciso|sre|site\s+reliability|devops|platform\s+eng|cto|founder|vp\s+eng|it\s+manager)\b", re.I)
# Split competitive/buying signals from DIY/switch signals for clearer intent
_BUYING_PAT = re.compile(r"\b(alternative\s+to|compare|vs\.|vs\b)\b", re.I)
_DIY_PAT = re.compile(r"\b(migrat(ed|ing)\s+to|switch(ed|ing)\s+to|rolled\s+our\s+own|diy)\b", re.I)

# Informational/promotional patterns that indicate non-help-seeking content
_INFO_PAT = re.compile(
    r"\b(how\s+i\s+set\s+up|how\s+we\s+built|case\s+study|guide|tutorial|my\s+setup|walkthrough|postmortem|we\s+built|we\s+launched|launch\s+post)\b",
    re.I,
)


def _hours_since(ts: str | None) -> float:
    if not ts:
        return 1e6
    try:
        dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
    except Exception:
        return 1e6
    return max(0.0, (datetime.now(timezone.utc) - dt).total_seconds() / 3600.0)


def _feature_from_regex(pat: re.Pattern, text: str, hi: float = 1.0, lo: float = 0.3) -> float:
    return hi if pat.search(text) else lo


def _solution_seed_fit(labels: Iterable[str], topics: Iterable[str]) -> float:
    uniq = {*(labels or []), *(topics or [])}
    if not uniq:
        return 0.2
    # Normalize by a small cap to avoid saturating easily
    return max(0.0, min(1.0, len(uniq) / 5.0))


def compute_demand(record: Dict) -> Tuple[Dict, float]:
    """Compute a simple demand vector and aggregate score.

    Inputs (expected keys): {id, ts, source, text, labels[], topics[], url, author, score, comments, age_hours}
    Returns: (demand_vector: dict, demand_score: float in [0,1])
    """
    text = (record.get("text") or "").lower()
    labels = record.get("labels") or []
    topics = record.get("topics") or []

    age_hours = record.get("age_hours")
    if age_hours is None:
        age_hours = _hours_since(record.get("ts"))

    # Features
    urgency = math.exp(-float(age_hours) / 36.0)
    pain = _feature_from_regex(_PAIN_PAT, text)
    budget_intent = _feature_from_regex(_BUDGET_PAT, text)
    audience_match = _feature_from_regex(_AUDIENCE_PAT, text, hi=0.9, lo=0.4)
    solution_fit = _solution_seed_fit(labels, topics)
    buying_intent = 1.0 if _BUYING_PAT.search(text) else 0.0
    diy_switch = 1.0 if _DIY_PAT.search(text) else 0.0
    informational = 1.0 if _INFO_PAT.search(text) else 0.0

    # Weights
    # Calibrated weights: positives sum to ~1.0; DIY/switch and informational are penalties
    w = {
        "urgency": 0.20,
        "pain": 0.24,
        "budget_intent": 0.18,
        "audience_match": 0.14,
        "solution_fit": 0.10,
        "buying_intent": 0.10,
        "diy_switch": -0.15,
        "info_penalty": -0.12,
    }

    z = (
        w["urgency"] * urgency
        + w["pain"] * pain
        + w["budget_intent"] * budget_intent
        + w["audience_match"] * audience_match
        + w["solution_fit"] * solution_fit
        + w["buying_intent"] * buying_intent
        + w["diy_switch"] * diy_switch
        + w["info_penalty"] * informational
    )

    score = max(0.0, min(1.0, float(z)))

    dv = {
        "urgency": round(float(urgency), 3),
        "pain": round(float(pain), 3),
        "budget_intent": round(float(budget_intent), 3),
        "audience_match": round(float(audience_match), 3),
        "solution_fit": round(float(solution_fit), 3),
        # Keep both: 'buying_intent' (internal) and 'competition' (external name expected by tests)
        "buying_intent": round(float(buying_intent), 3),
        "competition": round(float(buying_intent), 3),
        "diy_switch": round(float(diy_switch), 3),
        "informational": round(float(informational), 3),
    }
    return dv, score
