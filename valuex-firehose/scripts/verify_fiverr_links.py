from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import Dict, List, Tuple
from urllib.parse import urlparse, parse_qsl
import json

# Make repo root importable when running as a script
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
WS = ROOT.parent
if str(WS) not in sys.path:
    sys.path.insert(0, str(WS))

from linker.builder import build_fiverr_link
from config.load_env import load_env


def _split_url(u: str) -> Tuple[str, str, str, str, str]:
    """
    Returns (scheme, netloc, path, query, fragment) with fragment stripped from the query part.
    """
    if "#" in u:
        before, frag = u.split("#", 1)
    else:
        before, frag = u, ""
    p = urlparse(before)
    return p.scheme, p.netloc, p.path, p.query, frag


def classify_transform(input_url: str, output_url: str) -> str:
    if input_url == output_url:
        return "identity"
    # Allow only single append of afp before fragment
    if "#" in input_url:
        base_i, frag_i = input_url.split("#", 1)
        base_o, frag_o = output_url.split("#", 1)
        if frag_i != frag_o:
            return "other"
    else:
        base_i, base_o = input_url, output_url
    if base_o.startswith(base_i) and ("?afp=" in base_o or "&afp=" in base_o):
        return "append_afp"
    # Special case: base_i may end with '?' or '&'
    if (base_i.endswith("?") or base_i.endswith("&")) and ("afp=" in base_o) and base_o.startswith(base_i):
        return "append_afp"
    return "other"


def _verify_offer(input_url: str, afp: str) -> Dict:
    out = build_fiverr_link(input_url, afp=afp)
    transformation = classify_transform(input_url, out)
    return {
        "input_url": input_url,
        "output_url": out,
        "transformation": transformation,
        "rule_id": "fiverr.append_afp",
        "notes": "",
    }


def main() -> int:
    # Load env from JSON if provided; else layered dotenv
    env_json = os.environ.get("ENV_JSON") or None
    cfg = load_env(env_json)

    offers = [cfg.get("FIVERR_OFFER_1", ""), cfg.get("FIVERR_OFFER_2", ""), cfg.get("FIVERR_OFFER_3", "")]
    afp = cfg.get("FIVERR_AFP", "")
    out_path = ROOT / "data" / "verify_fiverr.jsonl"
    out_path.parent.mkdir(parents=True, exist_ok=True)

    results: List[Dict] = []
    with out_path.open("w", encoding="utf-8") as f:
        for u in offers:
            if not u:
                continue
            r = _verify_offer(u, afp)
            results.append(r)
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

    # Validate transformations
    bad = [r for r in results if r["transformation"] not in ("identity", "append_afp")]
    if bad:
        print("FAIL: Unsupported transformations encountered:")
        for r in bad:
            print(json.dumps(r, indent=2))
        return 2
    print(f"OK: wrote {len(results)} lines to {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
