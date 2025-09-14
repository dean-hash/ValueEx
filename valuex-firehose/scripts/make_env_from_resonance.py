from __future__ import annotations

import json
import os
from pathlib import Path

try:
    from dotenv import load_dotenv
except Exception as e:
    raise SystemExit("python-dotenv not installed in venv; install requirements first") from e

ROOT = Path(__file__).resolve().parents[1]
WS = ROOT.parent

# Load layered env: workspace -> resonance -> project
load_dotenv(WS / ".env")
load_dotenv(WS / "resonance" / ".env")
load_dotenv(ROOT / ".env", override=True)

mkt = os.getenv("FIVERR_LINK_MARKETPLACE", "").strip()
pro = os.getenv("FIVERR_LINK_PRO", "").strip()
logo = os.getenv("FIVERR_LINK_LOGOMAKER", "").strip()

avail = [x for x in (mkt, pro, logo) if x]
if not avail:
    raise SystemExit("No Fiverr offer URLs found in resonance/.env or layered .envs")

# Ensure all three offers are non-empty per schema by reusing any available
if not mkt:
    mkt = avail[0]
if not pro:
    pro = avail[0]
if not logo:
    logo = avail[0]

cfg = {
    "FIVERR_AFP": (os.getenv("FIVERR_AFP") or "VERIFY"),
    "FIVERR_OFFER_1": mkt,
    "FIVERR_OFFER_2": pro,
    "FIVERR_OFFER_3": logo,
    # Map AWIN publisher ID (not used for Fiverr verification but required by schema)
    "AWIN_PUBLISHER_ID": (os.getenv("AWIN_PUBLISHER_ID") or os.getenv("AWIN_PRIMARY_PUBLISHER_ID") or "1"),
}

out_path = ROOT / "config" / "env.from_resonance.json"
out_path.write_text(json.dumps(cfg, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Wrote {out_path}")
