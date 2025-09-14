from __future__ import annotations

import os
from urllib.parse import urlparse, parse_qsl, quote

import pytest

import offers.linker as linker
import offers.awin as awin_mod
from linker.builder import build_fiverr_link  # noqa: F401 ensure builder is imported in tests


@pytest.fixture(autouse=True)
def _clear_env(monkeypatch):
    # Ensure a clean env for each test
    for k in [
        "FIVERR_LINK_MARKETPLACE",
        "FIVERR_LINK_PRO",
        "FIVERR_LINK_LOGOMAKER",
        "FIVERR_SUB_PARAM",
        "SUBID_PREFIX",
        "FIVERR_SUBID_PREFIX",
    ]:
        monkeypatch.delenv(k, raising=False)


def test_fiverr_builder_preserves_base_and_appends_afp(monkeypatch):
    # Provide env base links
    base = "https://www.fiverr.com/logo-maker?utm_campaign=x#frag"
    monkeypatch.setenv("FIVERR_LINK_LOGOMAKER", base)

    match = {"merchant": "Fiverr", "offer_id": "fiverr_logo", "url": ""}
    out = linker.build_affiliate_url(match, topics=["logo"], source="unit", subid_prefix="TEST")

    # Base components preserved
    u_base = urlparse(base)
    u_out = urlparse(out)
    assert (u_base.scheme, u_base.netloc, u_base.path, u_base.fragment) == (
        u_out.scheme,
        u_out.netloc,
        u_out.path,
        u_out.fragment,
    )

    # Query matches base + appended 'afp'
    q_base = parse_qsl(u_base.query, keep_blank_values=True)
    q_out = parse_qsl(u_out.query, keep_blank_values=True)
    # remove subtracking from output for comparison
    q_wo = [(k, v) for (k, v) in q_out if k != "afp"]
    assert q_wo == q_base
    assert any(k == "afp" and v.startswith("TEST:unit:fiverr_logo") for (k, v) in q_out)


def test_fiverr_no_double_subparam_when_present(monkeypatch):
    base = "https://www.fiverr.com/marketplace?afp=PRESET"
    monkeypatch.setenv("FIVERR_LINK_MARKETPLACE", base)

    match = {"merchant": "Fiverr", "offer_id": "fiverr_marketplace", "url": ""}
    out = linker.build_affiliate_url(match, topics=["wordpress"], source="unit", subid_prefix="TEST")

    # Should not append another param when already present; base expected unchanged
    assert out == base


def test_awin_prebuilt_tracking_appends_clickref(monkeypatch):
    # Mock AWIN joined programmes to accept mid=123
    def fake_get_joined_programmes(force: bool = False):
        return ({"acme": ("123", "Acme")}, [])

    def fake_get_primary_publisher_id():
        return "999"  # not used in this branch

    monkeypatch.setenv("AWIN_API_KEY", "dummy")
    monkeypatch.setenv("AWIN_PRIMARY_PUBLISHER_ID", "999")
    # Prebuilt tracking path checks membership via offers.linker module-level imports
    monkeypatch.setattr(linker, "get_joined_programmes", fake_get_joined_programmes)
    monkeypatch.setattr(linker, "get_primary_publisher_id", fake_get_primary_publisher_id)

    tracking = "https://www.awin1.com/cread.php?awinmid=123&awinaffid=999"
    match = {"merchant": "Acme", "offer_id": "offer123", "tracking_url": tracking, "url": ""}
    out = linker.build_affiliate_url(match, topics=["topic"], source="unit", subid_prefix="TEST")

    u = urlparse(out)
    assert "awin1.com" in u.netloc
    q = dict(parse_qsl(u.query, keep_blank_values=True))
    assert q.get("awinmid") == "123"
    assert q.get("awinaffid") == "999"
    assert q.get("clickref", "").startswith("TEST:unit:offer123")


def test_awin_constructed_deeplink(monkeypatch):
    # Mock AWIN joined programmes to include Acme Co -> id 111, and set primary publisher id
    def fake_get_joined_programmes(force: bool = False):
        return ({"acmeco": ("111", "Acme Co")}, [])

    def fake_get_primary_publisher_id():
        return "999"

    monkeypatch.setenv("AWIN_API_KEY", "dummy")
    monkeypatch.setenv("AWIN_PRIMARY_PUBLISHER_ID", "999")
    monkeypatch.setattr(awin_mod, "get_joined_programmes", fake_get_joined_programmes)
    monkeypatch.setattr(awin_mod, "get_primary_publisher_id", fake_get_primary_publisher_id)

    dest = "https://dest.example/path?a=1"
    match = {"merchant": "Acme Co", "offer_id": "awin_acme", "url": dest}
    out = linker.build_affiliate_url(match, topics=["topic"], source="unit", subid_prefix="TEST")

    u = urlparse(out)
    assert "awin1.com" in u.netloc
    assert u.path.endswith("/cread.php")
    q = dict(parse_qsl(u.query, keep_blank_values=True))
    assert q.get("awinmid") == "111"
    assert q.get("awinaffid") == "999"
    assert q.get("clickref", "").startswith("TEST:unit:awin_acme")
    # parse_qsl decodes percent-encoding, so 'ued' equals the original dest
    assert q.get("ued") == dest


## No override test: builder enforces 'afp' key only per contract
