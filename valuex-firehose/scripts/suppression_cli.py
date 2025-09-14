#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

# Allow running from repo root or scripts/
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.suppression import (
    add_suppression,
    remove_suppression,
    is_suppressed,
    SUPPRESS_PATH,
)


def main() -> int:
    p = argparse.ArgumentParser(description="Suppression list CLI")
    sub = p.add_subparsers(dest="cmd", required=True)

    pc = sub.add_parser("check", help="Check if an email is suppressed")
    pc.add_argument("email")

    pa = sub.add_parser("add", help="Add an email to suppression list")
    pa.add_argument("email")
    pa.add_argument("--reason", default="manual")
    pa.add_argument("--source", default="cli")

    pr = sub.add_parser("remove", help="Remove an email from suppression list")
    pr.add_argument("email")

    pl = sub.add_parser("list", help="Print the suppression file path and first N entries")
    pl.add_argument("--head", type=int, default=10)

    args = p.parse_args()

    if args.cmd == "check":
        out = {"ok": True, "email": args.email, "suppressed": is_suppressed(args.email)}
        print(json.dumps(out))
        return 0

    if args.cmd == "add":
        out = add_suppression(args.email, reason=args.reason, source=args.source)
        out.update({"email": args.email})
        print(json.dumps(out))
        return 0 if out.get("ok") else 1

    if args.cmd == "remove":
        out = remove_suppression(args.email)
        out.update({"email": args.email})
        print(json.dumps(out))
        return 0 if out.get("ok") else 1

    if args.cmd == "list":
        print(json.dumps({"path": str(SUPPRESS_PATH)}))
        try:
            with open(SUPPRESS_PATH, "r", encoding="utf-8") as f:
                for i, line in enumerate(f):
                    if i >= int(args.head):
                        break
                    print(line.rstrip())
        except FileNotFoundError:
            pass
        return 0

    p.print_help()
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
