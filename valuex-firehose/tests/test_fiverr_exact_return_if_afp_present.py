from __future__ import annotations

from linker.builder import build_fiverr_link


def test_returns_input_byte_for_byte_if_afp_present():
    # Mixed casing, reserved chars, fragment, and existing afp
    url = "https://WWW.Fiverr.com/Path/File?q=a%20b%2B&C=3&afp=EXISTING#FragMent"
    out = build_fiverr_link(url, afp="NEW")
    assert out == url  # exact bytes preserved
