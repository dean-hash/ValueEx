#!/usr/bin/env python
from __future__ import annotations

import json
import os
import sys
from pathlib import Path
from typing import Dict, Any

import requests
from dotenv import load_dotenv

# Resolve project root and layer env files (workspace then project)
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
WORKSPACE = ROOT.parent
load_dotenv(WORKSPACE / ".env")
load_dotenv(ROOT / ".env", override=True)


def _ok(flag: bool, **extra) -> Dict[str, Any]:
    out = {"ok": bool(flag)}
    out.update(extra)
    return out


def _mask(val: str | None) -> str:
    if not val:
        return ""
    if len(val) <= 6:
        return "*" * len(val)
    return val[:2] + "*" * (len(val) - 6) + val[-4:]


def check_router() -> Dict[str, Any]:
    route_api = os.getenv("ROUTE_API", "http://127.0.0.1:8000").rstrip("/")
    res: Dict[str, Any] = {"base": route_api}
    try:
        r = requests.get(f"{route_api}/health", timeout=5)
        res["health"] = _ok(r.status_code == 200, status=r.status_code)
    except Exception as e:
        res["health"] = _ok(False, error=str(e)[:200])
    try:
        r = requests.get(f"{route_api}/metrics", timeout=5)
        res["metrics"] = _ok(r.status_code == 200, status=r.status_code)
    except Exception as e:
        res["metrics"] = _ok(False, error=str(e)[:200])
    try:
        # Minimal route test
        r = requests.post(f"{route_api}/route", json={"text": "My WordPress site SSL broke after DNS change"}, timeout=5)
        ok = r.status_code == 200 and isinstance(r.json(), dict)
        res["route_endpoint"] = _ok(ok, status=r.status_code)
    except Exception as e:
        res["route_endpoint"] = _ok(False, error=str(e)[:200])
    return res


def check_triage() -> Dict[str, Any]:
    provider = os.getenv("LLM_PROVIDER", "ollama").lower()
    res: Dict[str, Any] = {"provider": provider}
    if provider == "ollama":
        url = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434").rstrip("/")
        model = os.getenv("OLLAMA_MODEL", "llama3.1:8b")
        payload = {
            "model": model,
            "prompt": (
                "You are a concise triage assistant. Return STRICT JSON with keys: "
                "route (bool), topics (list[str]), angle (str), justification (str).\n\n"
                "Input:\nMy WordPress site SSL broke after DNS change.\n\nJSON:"
            ),
            "stream": False,
            "options": {"temperature": 0.2, "num_predict": 100},
        }
        try:
            r = requests.post(f"{url}/api/generate", json=payload, timeout=20)
            ok = r.status_code == 200
            data = r.json() if ok else {"status": r.status_code}
            res.update(_ok(ok, model=data.get("model", model), sample=(data.get("response") or "")[:140]))
        except Exception as e:
            res.update(_ok(False, error=str(e)[:200]))
        return res
    if provider == "groq":
        key = (os.getenv("GROQ_API_KEY") or "").strip()
        model = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
        if not key:
            return _ok(False, error="GROQ_API_KEY missing", provider=provider, model=model)
        try:
            r = requests.get("https://api.groq.com/openai/v1/models", headers={"Authorization": f"Bearer {key}"}, timeout=10)
            return _ok(r.status_code == 200, status=r.status_code, model=model, provider=provider)
        except Exception as e:
            return _ok(False, error=str(e)[:200], provider=provider, model=model)
    return _ok(False, error="Unsupported LLM_PROVIDER", provider=provider)


def check_env_flags() -> Dict[str, Any]:
    keys = [
        "LLM_TRIAGE",
        "LLM_TRIAGE_CENTER",
        "LLM_TRIAGE_WINDOW",
        "MONETIZE_SHADOW",
        "LEADS_V2_ONLY",
        "INGEST_METRICS_KEY",
        "ROUTE_API",
        "LLM_PROVIDER",
        "OLLAMA_URL",
        "OLLAMA_MODEL",
        "GROQ_API_KEY",
        "GROQ_MODEL",
    ]
    out = {}
    secretish = {
        "INGEST_METRICS_KEY",
        "GROQ_API_KEY",
    }
    for k in keys:
        v = os.getenv(k)
        shown = _mask(v) if (k in secretish) else (v or "")
        out[k] = {"set": v is not None, "value": shown}
    return out


def main() -> None:
    result = {
        "env": check_env_flags(),
        "router": check_router(),
        "triage": check_triage(),
        "root": str(ROOT),
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
