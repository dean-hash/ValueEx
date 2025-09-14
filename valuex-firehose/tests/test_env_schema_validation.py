from __future__ import annotations

from pathlib import Path
import json
import os
import pytest

from config.load_env import load_env, load_from_json, validate_mapping


def test_env_fixture_validates():
    root = Path(__file__).resolve().parents[1]
    cfg = load_env(str(root / "config" / "env.fixture.json"))
    assert cfg["FIVERR_AFP"] and cfg["AWIN_PUBLISHER_ID"]


def test_env_validation_errors_on_missing_keys(tmp_path: Path):
    bad = {
        "FIVERR_AFP": "X",
        "FIVERR_OFFER_1": "https://example.com",
        # missing OFFER_2, OFFER_3, AWIN_PUBLISHER_ID
    }
    p = tmp_path / "bad.json"
    p.write_text(json.dumps(bad), encoding="utf-8")
    with pytest.raises(RuntimeError):
        load_from_json(p)


def test_validate_mapping_helpers():
    ok, msg = validate_mapping({
        "FIVERR_AFP": "A",
        "FIVERR_OFFER_1": "url1",
        "FIVERR_OFFER_2": "url2",
        "FIVERR_OFFER_3": "url3",
        "AWIN_PUBLISHER_ID": "pid",
    })
    assert ok, msg
