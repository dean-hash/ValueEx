from __future__ import annotations

import os
from pathlib import Path

from demand.vectorizer import compute_demand
from offers.catalog import top_matches, load_offers, get_offers, refresh_offers


def test_compute_demand_ranges_and_keys():
    rec = {
        "ts": "2025-01-01T00:00:00Z",
        "source": "hn",
        "text": "We had a security breach and outage. Need urgent fix and budget approval.",
        "labels": ["repair_or_fix", "urgent_service"],
        "topics": ["ssl", "hosting"],
    }
    dv, score = compute_demand(rec)
    assert isinstance(dv, dict)
    assert isinstance(score, float)
    assert 0.0 <= score <= 1.0
    for k in ["urgency", "pain", "budget_intent", "audience_match", "solution_fit", "competition"]:
        assert k in dv
        assert 0.0 <= float(dv[k]) <= 1.0


def test_offers_top_matches_ssl_and_constraints(tmp_path: Path):
    # Point OFFERS_YAML to repo config/offers.yaml
    repo_root = Path(__file__).resolve().parents[1]
    offers_path = repo_root / "config" / "offers.yaml"
    assert offers_path.exists(), "Seed offers.yaml missing"
    os.environ["OFFERS_YAML"] = str(offers_path)

    # Force refresh
    refresh_offers()
    assert get_offers(), "Offers not loaded"

    text = "SSL certificate expired: security breach ongoing, need urgent fix"
    res = top_matches(text=text, labels=["urgent_service"], topics=["ssl"], k=5, source="hn")
    assert res, "Expected at least one match"
    merchants = {r.get("merchant") for r in res}
    # Ensure pruned/non-joined merchants are not present
    assert "Namecheap" not in merchants
    assert "DigitalOcean" not in merchants
    assert "Stripe" not in merchants
    # Ensure only Fiverr or known AWIN-joined merchants from our catalog appear
    allowed = {
        "Fiverr",
        "Create",
        "London Graphic Centre",
        "ClickInks.com (US)",
        "Super Cheap Signs (US)",
        "Learning 24/7",
    }
    assert merchants.issubset(allowed), f"Unexpected merchants found: {merchants - allowed}"


def test_offers_channel_constraints_social(tmp_path: Path):
    repo_root = Path(__file__).resolve().parents[1]
    offers_path = repo_root / "config" / "offers.yaml"
    os.environ["OFFERS_YAML"] = str(offers_path)
    refresh_offers()

    text = "Shopify theme broken, need urgent help"
    res_social = top_matches(text=text, labels=["repair_or_fix"], topics=["shopify"], k=3, source="twitter")
    assert res_social, "Expected matches for social channel"

    # For a source with channel 'content', ensure at least one match also appears
    res_content = top_matches(text=text, labels=["repair_or_fix"], topics=["shopify"], k=3, source="rss")
    assert res_content, "Expected matches for content channel"
