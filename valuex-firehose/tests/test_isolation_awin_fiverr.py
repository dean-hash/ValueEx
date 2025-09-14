from __future__ import annotations

from linker.builder import is_awin_tracking_url, build_fiverr_link, append_awin_clickref


def test_isolation_fiverr_on_awin_noop():
    awin = "https://www.awin1.com/cread.php?awinmid=123&awinaffid=999"
    assert is_awin_tracking_url(awin)
    # Fiverr builder must not mutate AWIN tracking links
    out = build_fiverr_link(awin, afp="X")
    assert out == awin


def test_isolation_awin_on_fiverr_noop():
    fiverr = "https://www.fiverr.com/categories/wordpress?a=1#frag"
    # AWIN clickref appender should no-op on non-AWIN links
    out = append_awin_clickref(fiverr, clickref="ID")
    assert out == fiverr
