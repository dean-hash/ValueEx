from __future__ import annotations

from valuex_common.normalization import (
    normalize_url,
    text_signature,
    normalize_email,
    normalize_phone,
)


def test_normalize_url_drops_tracking_and_trailing_slash():
    url = "HTTP://Example.COM/path/?utm_source=x&b=2&gclid=zzz"
    out = normalize_url(url)
    assert out == "http://example.com/path?b=2"


def test_normalize_url_handles_no_query_and_root_slash():
    assert normalize_url("https://EXAMPLE.com/") == "https://example.com/"


def test_text_signature_lowercase_punct_and_length():
    title = "Hello, World!"
    text = "This is a TEST. Newlines and    spaces will be normalized."
    sig = text_signature(title, text)
    assert "hello world" in sig
    assert "this is a test" in sig
    assert "newlines and spaces will be normalized" in sig


def test_normalize_email_gmail_rules():
    assert normalize_email("First.Last+tag@Gmail.com") == "firstlast@gmail.com"
    assert normalize_email("User@Example.com") == "user@example.com"


def test_normalize_phone_e164_like_rules():
    assert normalize_phone("(415) 555-1212") == "+14155551212"
    assert normalize_phone("1-415-555-1212") == "+14155551212"
    assert normalize_phone("+44 20 7946 0958") == "+442079460958"
