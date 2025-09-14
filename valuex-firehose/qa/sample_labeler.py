from __future__ import annotations

import random
from pathlib import Path
from datetime import datetime, timezone
from typing import List, Dict, Any

import orjson
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"


def _today() -> str:
    return datetime.now(tz=timezone.utc).strftime("%Y%m%d")


def _events_path() -> Path:
    return DATA / f"events_{_today()}.ndjson"


def load_events(path: Path) -> List[Dict[str, Any]]:
    if not path.exists():
        return []
    out: List[Dict[str, Any]] = []
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                out.append(orjson.loads(line))
            except Exception:
                continue
    return out


def main() -> None:
    ev_path = _events_path()
    rows = load_events(ev_path)
    cand = [r for r in rows if 0.4 <= float(r.get("score", 0.0)) <= 0.8]
    random.shuffle(cand)
    sample = cand[:50]

    if not sample:
        print("No candidate events in score band 0.4-0.8. Run ingestion first.")
        return

    df = pd.DataFrame.from_records(sample)
    # Add manual columns
    df.insert(0, "keep", "")
    df.insert(1, "reason", "")
    df.insert(2, "better_offer", "")

    out_csv = DATA / f"qa_samples_{_today()}.csv"
    df.to_csv(out_csv, index=False)
    print(f"Wrote {len(df)} samples to {out_csv}")


if __name__ == "__main__":
    main()
