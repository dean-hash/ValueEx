from __future__ import annotations

import os
import re
from typing import Optional, Dict
from urllib.parse import urlparse, quote_plus

# We intentionally avoid normalizing or re-serializing the URL.
# All operations preserve the original bytes of the input URL except for
# appending the single "afp" param when missing.


_AWIN_HOST_PATTERNS = (
    "awin1.com",
    "awin.com",
)


def is_awin_tracking_url(url: str) -> bool:
    """Return True if the URL appears to be an AWIN tracking link.

    Heuristics:
    - Host contains "awin1.com" or endswith "awin.com".
    - Or path contains "/cread.php" (common AWIN redirect path).
    """
    try:
        if not url:
            return False
        # Examine only the portion before the fragment
        base = url.split("#", 1)[0]
        p = urlparse(base)
        host = (p.netloc or "").lower()
        path = (p.path or "").lower()
        if any(h in host or host.endswith(h) for h in _AWIN_HOST_PATTERNS):
            return True
        if "/cread.php" in path:
            return True
        return False
    except Exception:
        return False


def _query_has_afp(base_without_fragment: str) -> bool:
    """Fast check whether the query string already contains an 'afp=' key.

    This does not decode or normalize anything to preserve exact input bytes.
    """
    if "?" not in base_without_fragment:
        return False
    q = base_without_fragment.split("?", 1)[1]
    # Treat '&' as separator; handle empty query gracefully
    if not q:
        return False
    # Look for 'afp=' at param boundaries
    return bool(re.search(r"(^|&)afp=", q))


def _query_has_param(base_without_fragment: str, key: str) -> bool:
    if not key:
        return False
    if "?" not in base_without_fragment:
        return False
    q = base_without_fragment.split("?", 1)[1]
    if not q:
        return False
    return bool(re.search(rf"(^|&){re.escape(key)}=", q))


def build_fiverr_link(url: str, afp: str) -> str:
    """Return URL or URL+afp with invariants preserved.

    Rules:
    - If the URL is an AWIN tracking URL, return it unchanged.
    - If an 'afp' param already exists, return the input byte-for-byte.
    - Else append 'afp' using standard encoding for its value, without altering
      path casing, host casing, existing query order, percent-encoding, or fragment bytes.
    """
    if not url or not isinstance(url, str):
        return url

    # Never mutate AWIN tracking URLs
    if is_awin_tracking_url(url):
        return url

    # Separate fragment without decoding
    has_frag = "#" in url
    if has_frag:
        base, frag = url.split("#", 1)
    else:
        base, frag = url, ""

    # If 'afp' already present, return original bytes unchanged
    if _query_has_afp(base):
        return url

    # Determine delimiter
    if "?" in base:
        # If base endswith '?' or '&', append directly
        if base.endswith("?") or base.endswith("&"):
            delim = ""
        else:
            delim = "&"
    else:
        delim = "?"

    # Encode afp value using application/x-www-form-urlencoded key semantics
    afp_value = quote_plus(afp or "", safe="")
    out = f"{base}{delim}afp={afp_value}"
    if has_frag:
        out = f"{out}#{frag}"
    return out


def build_awin_link(dest_url: str, merchant_name: str, *, clickref: Optional[str] = None, awinmid: Optional[str] = None, publisher_id: Optional[str] = None) -> str:
    """Construct an AWIN 'cread.php' URL for a joined merchant.

    This never wraps native Fiverr URLs implicitly. Caller must decide when to use it.
    """
    try:
        if not dest_url or not merchant_name:
            return ""
        if (merchant_name or "").strip().lower() == "fiverr":
            # Do not wrap native Fiverr URLs
            return ""

        # Allow caller to provide awinmid/publisher_id; otherwise fetch from env/offers.awin
        if not (awinmid and publisher_id):
            try:
                from offers.awin import get_joined_programmes, get_primary_publisher_id, normalize_merchant_name
            except Exception:
                return ""
            by_norm, _ = get_joined_programmes(force=False)
            norm = normalize_merchant_name(merchant_name)
            info = by_norm.get(norm)
            if not info:
                return ""
            if not awinmid:
                awinmid = str(info[0])
            if not publisher_id:
                publisher_id = str(get_primary_publisher_id() or "")
        if not awinmid or not publisher_id:
            return ""

        # Manual assembly to preserve encoded 'ued'
        ued = quote_plus(dest_url, safe="")
        base = "https://www.awin1.com/cread.php"
        parts = [
            f"awinmid={awinmid}",
            f"awinaffid={publisher_id}",
        ]
        if clickref:
            # AWIN clickref length constraints typically ~128; trim to 120 conservatively
            parts.append(f"clickref={quote_plus(str(clickref)[:120], safe='')}")
        parts.append(f"ued={ued}")
        return f"{base}?" + "&".join(parts)
    except Exception:
        return ""


def append_awin_clickref(url: str, clickref: Optional[str]) -> str:
    """Append clickref to an AWIN tracking URL preserving invariants.

    - If not an AWIN tracking URL, return the input unchanged.
    - If clickref absent and a value is provided, append it without altering existing bytes.
    - If clickref already present or value is falsy, return input unchanged.
    """
    try:
        if not url or not is_awin_tracking_url(url) or not clickref:
            return url
        # Separate fragment
        has_frag = "#" in url
        if has_frag:
            base, frag = url.split("#", 1)
        else:
            base, frag = url, ""
        if _query_has_param(base, "clickref"):
            return url
        # Determine delimiter
        if "?" in base:
            delim = "" if (base.endswith("?") or base.endswith("&")) else "&"
        else:
            delim = "?"
        out = f"{base}{delim}clickref={quote_plus(str(clickref)[:120], safe='')}"
        if has_frag:
            out = f"{out}#{frag}"
        return out
    except Exception:
        return url
