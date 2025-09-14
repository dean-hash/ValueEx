# monetize/planner.py
from __future__ import annotations

from typing import Dict, List, Any

__all__ = ["plan_lead", "__version__"]
__version__ = "0.1.0"


def _pick_angle(text: str) -> str:
    t = (text or "").lower()
    if any(k in t for k in ["breach", "security", "compliance", "audit"]):
        return "security-pain"
    if any(k in t for k in ["budget", "cost", "price", "save", "savings"]):
        return "cost-cutting"
    if any(k in t for k in ["deadline", "asap", "blocked", "outage", "urgent"]):
        return "urgent-fix"
    return "productivity/velocity"


def plan_lead(event: Dict[str, Any], offer: Dict[str, Any] | None) -> Dict[str, Any]:
    txt = f"{event.get('text','')}".strip()
    angle = _pick_angle(txt)
    dv = event.get("demand_vector", {}) or {}
    urgent = (float(dv.get("urgency", 0.0)) >= 0.8) or (float(event.get("age_hours", 9999.0)) <= 3.0)
    cta = "Try the 15-minute fix" if urgent else "See ROI breakdown"

    seed_a = (
        f"Angle: {angle}\n"
        f"Hook: Quick win now, durable fix next.\n"
        f"Option A (free workaround): outline 1–2 steps tailored to the post.\n"
        + (f"Option B (paid, {offer['merchant']}): {offer['offer_id']} — 15‑minute setup. {offer['url']}" if offer else "")
    ).strip()

    seed_b = (
        f"Angle: {angle}\n"
        f"Hook: Triage first, optimize later.\n"
        f"Share a 2‑step workaround and request permission to follow up with tools."
    )

    channels = ["forums"]
    src = (event.get("source") or "").lower()
    if src in {"x", "twitter"}:
        channels = ["social"]
    elif src in {"rss"}:
        channels = ["content"]

    constraints_applied = (offer.get("constraints", {}) if offer else {})

    justification_envelope = {
        "signals": [
            f"labels: {','.join(event.get('labels', []))}",
            f"topics: {','.join(event.get('topics', []))}",
            f"urgency={dv.get('urgency', 0)} pain={dv.get('pain', 0)}",
        ],
        "consent_basis": "shadow_analysis_only",
        "constraints": constraints_applied,
        "reasoning_trace": ["vectorize", "match_offers", "priority", "plan"],
    }

    return {
        "angle_tag": angle,
        "cta": cta,
        "seed_variants": [seed_a, seed_b],
        "tests": [
            {"hypothesis": "Urgency hook boosts CTR", "variant": "urgent-fix", "metric": "CTR"},
            {"hypothesis": "Cost framing increases conversion intent", "variant": "cost-cutting", "metric": "CVR"},
        ],
        "channels": channels,
        "constraints_applied": constraints_applied,
        "justification_envelope": justification_envelope,
    }
