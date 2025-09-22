"""Actionability scoring (design-first stub)."""
from typing import Dict

def score(features: Dict[str, float], weights: Dict[str, float]) -> float:
    """Compute S = sum(w*feature) applying penalties and clipping to [0,1]."""
    keys = [
        "intent_need",
        "urgency",
        "contactability",
        "budget_present",
        "recency",
        "toxicity",
        "ambiguity",
        "implicit_boost",
        "engagement_norm",
    ]
    value = 0.0
    value += weights.get("intent_need", 0.0) * features.get("intent_need", 0.0)
    value += weights.get("urgency", 0.0) * features.get("urgency", 0.0)
    value += weights.get("contactability", 0.0) * features.get("contactability", 0.0)
    value += weights.get("budget", 0.0) * features.get("budget_present", 0.0)
    value += weights.get("recency", 0.0) * features.get("recency", 0.0)
    value -= weights.get("toxicity", 0.0) * features.get("toxicity", 0.0)
    value -= weights.get("ambiguity", 0.0) * features.get("ambiguity", 0.0)
    value += weights.get("implicit_boost", 0.0) * features.get("implicit_boost", 0.0)
    value += weights.get("engagement_norm", 0.0) * features.get("engagement_norm", 0.0)
    return max(0.0, min(1.0, value))
