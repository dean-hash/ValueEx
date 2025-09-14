#!/usr/bin/env python
from __future__ import annotations

import json
import os
from pathlib import Path
import requests
from dotenv import load_dotenv

# Load workspace and project .env for layered configuration
ROOT = Path(__file__).resolve().parents[1]
WORKSPACE = ROOT.parent
load_dotenv(WORKSPACE / ".env")
load_dotenv(ROOT / ".env", override=True)

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434")
MODEL = os.getenv("OLLAMA_MODEL", "llama3.1:8b")


def triage_sample():
    text = os.getenv(
        "TRIAGE_SAMPLE",
        "I'm migrating a WordPress site to a VPS and my SSL cert broke after moving DNS. How can I fix this quickly?",
    )
    prompt = (
        "You are a concise triage assistant. Given a user post, decide if it's a monetizable demand signal "
        "for web/infra/dev help. Return STRICT JSON only with keys: "
        "route (bool), topics (list[str]), angle (str), justification (str).\n\n"
        f"Input:\n{text}\n\nJSON:"
    )
    payload = {
        "model": MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {"temperature": 0.2, "num_predict": 200},
    }
    try:
        r = requests.post(f"{OLLAMA_URL}/api/generate", json=payload, timeout=60)
        r.raise_for_status()
        data = r.json()
        raw = (data.get("response") or "").strip()
        try:
            obj = json.loads(raw)
        except Exception:
            obj = {"raw": raw}
        return {"ok": True, "model": data.get("model"), "output": obj}
    except Exception as e:
        return {"ok": False, "error": f"{type(e).__name__}: {e}"[:300]}


def main():
    res = triage_sample()
    print(json.dumps(res, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
