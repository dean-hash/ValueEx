from __future__ import annotations

import hashlib
import json
import os
import threading
import time
from pathlib import Path
from typing import Dict, Set

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
SUPPRESS_PATH = DATA_DIR / "suppression.jsonl"

_lock = threading.Lock()
_cache_loaded = False
_cache: Set[str] = set()  # sha256 lowercase


def _ensure_dirs() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not SUPPRESS_PATH.exists():
        SUPPRESS_PATH.touch()


def _sha(email: str) -> str:
    return hashlib.sha256((email or "").strip().lower().encode("utf-8")).hexdigest()


def _load_cache() -> None:
    global _cache_loaded
    if _cache_loaded:
        return
    _ensure_dirs()
    try:
        with SUPPRESS_PATH.open("r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    rec = json.loads(line)
                    h = rec.get("sha256")
                    if h:
                        _cache.add(h)
                except Exception:
                    continue
    finally:
        _cache_loaded = True


def is_suppressed(email: str) -> bool:
    if not email:
        return False
    with _lock:
        _load_cache()
        return _sha(email) in _cache


def add_suppression(email: str, *, reason: str = "", source: str = "") -> Dict:
    if not email:
        return {"ok": False, "error": "missing email"}
    rec = {
        "sha256": _sha(email),
        "reason": reason,
        "source": source,
        "ts": int(time.time()),
    }
    with _lock:
        _load_cache()
        if rec["sha256"] in _cache:
            return {"ok": True, "already": True}
        _ensure_dirs()
        with SUPPRESS_PATH.open("a", encoding="utf-8") as f:
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")
        _cache.add(rec["sha256"])
    return {"ok": True}


def remove_suppression(email: str) -> Dict:
    if not email:
        return {"ok": False, "error": "missing email"}
    h = _sha(email)
    with _lock:
        _load_cache()
        if h not in _cache:
            return {"ok": True, "not_found": True}
        # rewrite file without this hash
        _ensure_dirs()
        try:
            lines = SUPPRESS_PATH.read_text(encoding="utf-8").splitlines()
        except Exception:
            lines = []
        with SUPPRESS_PATH.open("w", encoding="utf-8") as f:
            for line in lines:
                try:
                    rec = json.loads(line)
                    if rec.get("sha256") == h:
                        continue
                except Exception:
                    pass
                f.write(line + "\n")
        _cache.discard(h)
    return {"ok": True}
