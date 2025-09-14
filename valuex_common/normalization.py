from __future__ import annotations

import re
from typing import Any, Optional
from urllib.parse import urlparse, urlunparse, parse_qsl, urlencode

__all__ = [
    "normalize_url",
    "text_signature",
    "normalize_email",
    "normalize_phone",
]

# Common tracking params to drop when canonicalizing URLs
_UTM_PARAMS = {
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "gclid",
    "fbclid",
}


def normalize_url(url: Optional[str]) -> Optional[str]:
    if not url:
        return None
    try:
        u = urlparse(url)
        netloc = (u.netloc or "").lower()
        path = u.path or "/"
        # remove trailing slash except for root
        if path != "/" and path.endswith("/"):
            path = path[:-1]
        # drop common tracking params
        q = {k: v for k, v in parse_qsl(u.query) if k.lower() not in _UTM_PARAMS}
        return urlunparse((u.scheme or "https", netloc, path, "", urlencode(q), ""))
    except Exception:
        return url


_WS_RE = re.compile(r"\s+", re.MULTILINE)
_PUNCT_RE = re.compile(r"[^a-z0-9]+", re.IGNORECASE)


def text_signature(title: Optional[str], text: Optional[str], limit: int = 500) -> str:
    t = (title or "").strip() + "\n" + (text or "").strip()
    t = _WS_RE.sub(" ", t).lower()
    t = _PUNCT_RE.sub(" ", t)
    t = " ".join(t.split())[:limit]
    return t


def normalize_email(email: Optional[str]) -> Optional[str]:
    """Normalize an email for canonicalization.

    - Lowercase local and domain.
    - For Gmail/Googlemail, drop dots in local-part and ignore "+" tags.
    """
    if not email or not isinstance(email, str):
        return None
    e = email.strip().lower()
    if "@" not in e:
        return e
    local, domain = e.split("@", 1)
    if domain in ("gmail.com", "googlemail.com"):
        # strip +tag
        if "+" in local:
            local = local.split("+", 1)[0]
        # remove dots
        local = local.replace(".", "")
        domain = "gmail.com"
    return f"{local}@{domain}"


def normalize_phone(phone: Optional[str]) -> Optional[str]:
    """Normalize a phone number into a simple E.164-like form without external deps.

    Rules:
    - Keep digits only; infer country code when plausible.
    - If 10 digits, assume US/Canada and prefix with "+1".
    - If 11-15 digits, prefix with "+" (treat as already including country code).
    - Otherwise, return digits as-is if any, else None.
    """
    if not phone or not isinstance(phone, str):
        return None
    digits = re.sub(r"\D", "", phone)
    if not digits:
        return None
    # Handle NANP common cases
    if len(digits) == 10:
        return "+1" + digits
    if len(digits) == 11 and digits.startswith("1"):
        return "+" + digits
    if 11 <= len(digits) <= 15:
        return "+" + digits
    # Fallback: return raw digits
    return digits
