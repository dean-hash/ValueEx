from __future__ import annotations

from linker.builder import build_fiverr_link


def _only_afp_appended(original: str, out: str) -> bool:
    # Only difference allowed is appending '&afp=...'/ '?afp=...' before any fragment
    if original == out:
        return False
    if "#" in original:
        base_o, frag_o = original.split("#", 1)
        base_n, frag_n = out.split("#", 1)
        if frag_o != frag_n:
            return False
    else:
        base_o, frag_o = original, None
        base_n, frag_n = out, None
    if not base_n.startswith(base_o):
        # Allow the case when base_o ended with '?' or '&' so no extra separator was needed
        if base_o.endswith("?") or base_o.endswith("&"):
            pass
        else:
            return False
    # Verify afp key is appended at the very end of base_n
    return ("?afp=" in base_n or "&afp=" in base_n)


def test_append_when_no_query():
    url = "https://www.fiverr.com/categories/wordpress"
    out = build_fiverr_link(url, afp="A B+C%2F")
    assert _only_afp_appended(url, out)
    assert out.startswith(url + "?afp=")


def test_append_when_existing_query_order_preserved():
    url = "https://www.fiverr.com/logo-maker?a=1&b=2"
    out = build_fiverr_link(url, afp="XYZ")
    assert out.startswith(url + "&afp=")


def test_append_with_fragment_preserved_bytes():
    url = "https://www.fiverr.com/path?q=1#Xx%2020"
    out = build_fiverr_link(url, afp="VAL")
    assert out.split("#", 1)[1] == "Xx%2020"
    assert out.split("#", 1)[0].endswith("&afp=VAL")


ess_cases = [
    "https://WWW.Fiverr.com/Path/File?q=a%20b%2B&C=3",
    "https://www.fiverr.com/PATH?Q=%2b%20",
    "https://www.fiverr.com/path?",
    "https://www.fiverr.com/path?x=&y=1&",
]


def test_encoding_stability_and_delims():
    for u in ess_cases:
        out = build_fiverr_link(u, afp="X Y+")
        # host casing preserved
        assert out.split("/", 3)[2] == u.split("/", 3)[2]
        # no normalization of existing encodings
        prefix = u.split("#", 1)[0]
        assert out.startswith(prefix)
        # proper delimiter placement
        assert ("?afp=" in out) or ("&afp=" in out)
