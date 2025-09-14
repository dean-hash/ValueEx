from __future__ import annotations

from typing import Dict, Optional
from urllib.parse import urlencode, urlparse, parse_qsl

__all__ = ["with_query"]


def with_query(url: str, params: Optional[Dict[str, str]]) -> str:
    """
    Append query params without altering the original URL's existing structure.
    We preserve the exact base URL (host, path, and existing query) to avoid breaking
    affiliate links provided by partners (e.g., Fiverr). Only new params are appended.
    Fragment (if any) is preserved at the end.
    """
    if not url or not params:
        return url
    try:
        # Separate fragment to ensure params are added before it
        if "#" in url:
            base, frag = url.split("#", 1)
            has_frag = True
        else:
            base, frag, has_frag = url, "", False

        u = urlparse(base)
        existing_keys = {k for k, _ in parse_qsl(u.query, keep_blank_values=True)}
        # Only append params that don't already exist to avoid mutating the base link
        append_items = [(k, v) for k, v in (params or {}).items() if v is not None and k not in existing_keys]
        if not append_items:
            return url  # nothing to add; return original verbatim

        encoded = urlencode(append_items)
        if not encoded:
            return url

        # Choose delimiter based on presence of existing query
        delim = "&" if ("?" in base and not base.endswith("?")) else "?"
        out = f"{base}{delim}{encoded}"
        if has_frag:
            out = f"{out}#{frag}"
        return out
    except Exception:
        return url
