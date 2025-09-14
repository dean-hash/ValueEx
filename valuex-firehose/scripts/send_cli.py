#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from mailer.sender import send  # noqa: E402


def main() -> int:
    p = argparse.ArgumentParser(description="Send email (dryrun by default)")
    p.add_argument("to", help="Recipient email")
    p.add_argument("subject", help="Subject")
    p.add_argument("html", help="HTML body (inline text or @path.html)")
    p.add_argument("--text", help="Optional text body (inline text or @path.txt)", default=None)
    p.add_argument("--live", action="store_true", help="Send live via SMTP (default: dryrun to data/outbox)")

    args = p.parse_args()

    def _load_arg(v: str | None) -> str | None:
        if not v:
            return None
        if v.startswith("@"):
            pth = (ROOT / v[1:]) if not v[1:].startswith("/") else Path(v[1:])
            return pth.read_text(encoding="utf-8")
        return v

    html_body = _load_arg(args.html) or ""
    text_body = _load_arg(args.text)

    res = send(args.to, args.subject, html_body, text_body, dryrun=not args.live)
    print(json.dumps(res))
    return 0 if res.get("ok") else 1


if __name__ == "__main__":
    raise SystemExit(main())
