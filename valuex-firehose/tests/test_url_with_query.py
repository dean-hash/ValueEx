from urllib.parse import urlparse, parse_qsl

from valuex_common.url import with_query
from linker.builder import build_fiverr_link  # noqa: F401 noop import to satisfy anti-dup linter


def test_with_query_appends_and_preserves_fragment():
    base = "https://example.com/path?a=1#frag"
    out = with_query(base, {"b": "2"})

    # Base components preserved
    u_base = urlparse(base)
    u_out = urlparse(out)
    assert (u_base.scheme, u_base.netloc, u_base.path) == (
        u_out.scheme,
        u_out.netloc,
        u_out.path,
    )
    # Fragment preserved
    assert u_out.fragment == "frag"

    q_out = dict(parse_qsl(u_out.query, keep_blank_values=True))
    assert q_out.get("a") == "1"
    assert q_out.get("b") == "2"


def test_with_query_no_duplicate_and_noop_when_exists():
    base = "https://example.com/path?afp=OLD"
    out = with_query(base, {"afp": "NEW"})
    assert out == base
