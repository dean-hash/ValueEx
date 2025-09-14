"""
valuex_common: shared utilities across the ValueX workspace.

Exports:
- normalize_url, text_signature, normalize_email, normalize_phone (from normalization)
- with_query (from url)
"""
from .normalization import (
    normalize_url,
    text_signature,
    normalize_email,
    normalize_phone,
)
from .url import with_query
