from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import argparse
import re
import json
from datetime import datetime, timezone
import httpx

# Make repo root importable when running as a script
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

# Load environment variables with layering (workspace -> resonance -> project)
try:
    from dotenv import load_dotenv
    WORKSPACE = ROOT.parent
    # Load workspace-level defaults if present
    load_dotenv(WORKSPACE / ".env")
    # Also load resonance/.env where affiliate creds are stored
    load_dotenv(WORKSPACE / "resonance" / ".env")
    # Project-level overrides
    load_dotenv(ROOT / ".env", override=True)
except Exception:
    # Optional dependency; continue if missing
    pass

from offers.catalog import get_offers
from offers.awin import (
    get_joined_programmes,
    get_programmes,
    get_primary_publisher_id,
)
import yaml


def _norm(s: str | None) -> str:
    s = (s or "").strip().lower()
    return "".join(ch for ch in s if ch.isalnum())


def _name_from_item(it: Dict) -> str:
    return (
        it.get("advertiserName")
        or it.get("name")
        or (it.get("advertiser") or {}).get("name")
        or ""
    )


def _id_from_item(it: Dict) -> str:
    return str(
        it.get("advertiserId") or it.get("id") or (it.get("advertiser") or {}).get("id") or ""
    )


def _display_url_from_item(it: Dict) -> str:
    # Try a variety of common fields seen in AWIN responses
    candidates = [
        it.get("displayUrl"),
        it.get("url"),
        it.get("homepageUrl"),
        it.get("programmeUrl"),
        it.get("programUrl"),
        (it.get("advertiser") or {}).get("url"),
        (it.get("advertiser") or {}).get("websiteUrl"),
    ]
    for c in candidates:
        if isinstance(c, str) and c.strip():
            return c.strip()
    return ""


def _ensure_http(url: str) -> str:
    u = (url or "").strip()
    if not u:
        return ""
    if re.match(r"^https?://", u, re.I):
        return u
    # If looks like a domain, prefix https://
    if "." in u and " " not in u:
        return f"https://{u}"
    return u


def _slug(s: str) -> str:
    s = (s or "").strip().lower()
    s = re.sub(r"[^a-z0-9]+", "_", s)
    s = re.sub(r"_+", "_", s).strip("_")
    return s or "merchant"


def audit_offers_and_env() -> int:
    offers = get_offers()
    merchants = sorted({str(o.get("merchant") or "") for o in offers})

    by_norm_joined, _joined_raw = get_joined_programmes(force=True)
    pending_raw = get_programmes("pending") or []
    notjoined_raw = get_programmes("notjoined") or []

    pending_set = {_norm(_name_from_item(it)) for it in pending_raw}
    notjoined_set = {_norm(_name_from_item(it)) for it in notjoined_raw}

    rows: List[Tuple[str, str, str, str]] = []  # (merchant, status, advertiser_id, display_name)

    for m in merchants:
        if not m:
            continue
        if m.lower() == "fiverr":
            rows.append((m, "direct", "", "Fiverr (direct partner)"))
            continue
        norm = _norm(m)
        if norm in by_norm_joined:
            adv_id, disp = by_norm_joined[norm]
            rows.append((m, "joined", adv_id, disp))
        elif norm in pending_set:
            it = next((x for x in pending_raw if _norm(_name_from_item(x)) == norm), {})
            rows.append((m, "pending", _id_from_item(it), _name_from_item(it)))
        elif norm in notjoined_set:
            it = next((x for x in notjoined_raw if _norm(_name_from_item(x)) == norm), {})
            rows.append((m, "not_joined", _id_from_item(it), _name_from_item(it)))
        else:
            rows.append((m, "unknown", "", ""))

    # Output
    print("# AWIN / Fiverr Audit\n")
    pid = get_primary_publisher_id()
    print(f"- AWIN Publisher ID: {pid or '(unset)'}")
    token = os.getenv("AWIN_API_KEY") or os.getenv("AWIN_API_TOKEN") or ""
    tok_disp = (token[:4] + "..." + token[-4:]) if token and len(token) >= 8 else ("(unset)" if not token else "(set)")
    print(f"- AWIN API token: {tok_disp}")

    print("\n- Fiverr links:")
    for key in ("FIVERR_LINK_MARKETPLACE", "FIVERR_LINK_PRO", "FIVERR_LINK_LOGOMAKER"):
        val = os.getenv(key) or ""
        print(f"  - {key}: {'set' if val else 'MISSING'}")

    print("\n# Merchants in offers.yaml and AWIN status\n")
    for m, status, aid, disp in rows:
        extra = f" (id={aid}, name={disp})" if aid else (f" (name={disp})" if disp else "")
        print(f"- {m}: {status}{extra}")

    return 0


def list_joined() -> int:
    pid = get_primary_publisher_id()
    by_norm, items = get_joined_programmes(force=True)
    print("# Joined Programmes (AWIN)\n")
    print(f"- Using Publisher ID: {pid or '(unset)'}\n")
    for it in items:
        name = _name_from_item(it)
        aid = _id_from_item(it)
        url = _ensure_http(_display_url_from_item(it))
        extra = f" url={url}" if url else ""
        print(f"- {name} (id={aid}){extra}")
    print(f"\nTotal joined: {len(items)}")
    return 0


def list_relationship(relationship: str) -> int:
    pid = get_primary_publisher_id()
    items = get_programmes(relationship) or []
    print(f"# Programmes (relationship={relationship})\n")
    print(f"- Using Publisher ID: {pid or '(unset)'}\n")
    for it in items:
        name = _name_from_item(it)
        aid = _id_from_item(it)
        url = _ensure_http(_display_url_from_item(it))
        extra = f" url={url}" if url else ""
        print(f"- {name} (id={aid}){extra}")
    print(f"\nTotal {relationship}: {len(items)}")
    return 0


def snapshot_programmes(out_path: Optional[str] = None) -> int:
    pid = get_primary_publisher_id()
    joined = get_programmes("joined") or []
    payload = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "pid": pid,
        "counts": {"joined": len(joined)},
        "joined": [
            {"id": _id_from_item(it), "name": _name_from_item(it), "url": _ensure_http(_display_url_from_item(it))}
            for it in joined
        ],
    }
    out_file = Path(out_path) if out_path else (ROOT / "data" / f"awin_joined_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
    out_file.parent.mkdir(parents=True, exist_ok=True)
    with out_file.open("w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    print(f"Wrote AWIN snapshot to {out_file}")
    return 0


def check_links() -> int:
    offers = get_offers()
    if not offers:
        print("No offers loaded.")
        return 0
    print("# Link checks (offers.yaml landing_urls)\n")
    bad = 0
    total = 0
    skipped_offers = 0
    timeout = httpx.Timeout(10.0, connect=10.0)
    headers = {"User-Agent": "ValueX-OfferCheck/1.0"}
    with httpx.Client(follow_redirects=True, timeout=timeout, headers=headers) as client:
        for o in offers:
            merchant = o.get("merchant")
            status = str(o.get("status") or "").lower()
            # Skip Fiverr (we don't use landing_urls for monetization) and paused/inactive offers
            if str(merchant or "").strip().lower() == "fiverr" or status in {"paused", "inactive", "expired", "closed"}:
                skipped_offers += 1
                continue
            oid = o.get("id")
            for url in (o.get("landing_urls") or []):
                total += 1
                try:
                    r = client.get(url)
                    ok = 200 <= r.status_code < 400
                except Exception as e:
                    ok = False
                if not ok:
                    bad += 1
                    print(f"- BAD: offer={oid} merchant={merchant} url={url}")
    print(f"\nChecked {total} URLs; bad={bad}; skipped_offers={skipped_offers}")
    return 0


def seed_offers_yaml(out_path: Optional[str] = None) -> int:
    _, items = get_joined_programmes(force=True)
    offers: List[Dict] = []
    for it in items:
        name = _name_from_item(it)
        if not name:
            continue
        aid = _id_from_item(it)
        url = _ensure_http(_display_url_from_item(it))
        slug = _slug(name)
        oid = f"awin_{aid}_{slug}" if aid else f"awin_{slug}"
        offer = {
            "id": oid,
            "merchant": name,
            "epc_est": 0.30,
            "deep_link_ok": True,
            "categories": [],
            "angles": ["productivity/velocity"],
            "landing_urls": [url] if url else [],
            "constraints": {"channels": ["forums", "social", "content"], "geo": ["GLOBAL"]},
        }
        offers.append(offer)

    # Write to config/offers.seed.yaml by default
    out_file = Path(out_path) if out_path else (ROOT / "config" / "offers.seed.yaml")
    out_file.parent.mkdir(parents=True, exist_ok=True)

    header = (
        "# Auto-generated from AWIN joined programmes.\n"
        "# Review and enrich categories/angles per merchant before using in production.\n"
        "# Safe defaults: geo=GLOBAL, channels=[forums,social,content].\n\n"
    )
    with out_file.open("w", encoding="utf-8") as f:
        f.write(header)
        yaml.safe_dump(offers, f, sort_keys=False, allow_unicode=True)
    print(f"Wrote seed offers to {out_file}")
    return 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AWIN/Fiverr audit and seeding utilities")
    parser.add_argument("--list-joined", action="store_true", help="Print all joined AWIN programmes")
    parser.add_argument("--seed-offers", nargs="?", const="", help="Write seed offers YAML from joined programmes (optional output path)")
    parser.add_argument("--pid", help="Override AWIN_PRIMARY_PUBLISHER_ID for this run")
    parser.add_argument("--list-rel", help="List programmes for an AWIN relationship (pending, suspended, notjoined, etc.)")
    parser.add_argument("--snapshot", nargs="?", const="", help="Write a JSON snapshot of joined programmes (optional output path)")
    parser.add_argument("--check-links", action="store_true", help="Check landing_urls from offers.yaml for HTTP reachability")
    args = parser.parse_args()

    # Default behavior: environment + offers.yaml audit
    if not args.list_joined and args.seed_offers is None and not args.list_rel and args.snapshot is None and not args.check_links:
        raise SystemExit(audit_offers_and_env())

    rc = 0
    if args.pid:
        os.environ["AWIN_PRIMARY_PUBLISHER_ID"] = str(args.pid)
    if args.list_joined:
        rc |= list_joined()
    if args.list_rel:
        rc |= list_relationship(args.list_rel)
    if args.seed_offers is not None:
        path = None if args.seed_offers == "" else args.seed_offers
        rc |= seed_offers_yaml(path)
    if args.snapshot is not None:
        path = None if args.snapshot == "" else args.snapshot
        rc |= snapshot_programmes(path)
    if args.check_links:
        rc |= check_links()
    raise SystemExit(rc)
