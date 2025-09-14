from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Dict, Tuple, Optional

from jsonschema import validate, ValidationError

# Locations
ROOT = Path(__file__).resolve().parents[1]
SCHEMA_PATH = ROOT / "config" / "env.schema.json"
FIXTURE_PATH = ROOT / "config" / "env.fixture.json"

REQUIRED_KEYS = [
    "FIVERR_AFP",
    "FIVERR_OFFER_1",
    "FIVERR_OFFER_2",
    "FIVERR_OFFER_3",
    "AWIN_PUBLISHER_ID",
]


def _read_schema() -> dict:
    return json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))


def validate_mapping(cfg: Dict[str, str]) -> Tuple[bool, str]:
    try:
        validate(instance=cfg, schema=_read_schema())
        return True, ""
    except ValidationError as e:
        return False, f"Env validation error: {e.message} at {'/'.join(map(str, e.path)) or '<root>'}"


def load_from_json(path: Path | str) -> Dict[str, str]:
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(f"Env JSON not found: {p}")
    try:
        cfg = json.loads(p.read_text(encoding="utf-8"))
    except Exception as e:
        raise RuntimeError(f"Invalid JSON at {p}: {e}")
    ok, msg = validate_mapping(cfg)
    if not ok:
        raise RuntimeError(msg)
    return {k: str(v) for k, v in cfg.items()}


def load_layered_dotenv() -> Dict[str, str]:
    """Load layered .env files (workspace -> resonance -> project) then extract keys.

    This is primarily for local verification when a JSON fixture isn't provided.
    """
    try:
        from dotenv import load_dotenv
    except Exception as e:
        raise RuntimeError("python-dotenv not installed; either install it or use env.fixture.json") from e

    WS = ROOT.parent
    # Workspace-level
    load_dotenv(WS / ".env")
    # resonance/.env (contains affiliate creds in this monorepo)
    load_dotenv(WS / "resonance" / ".env")
    # Project-level overrides
    load_dotenv(ROOT / ".env", override=True)

    cfg = {k: os.getenv(k, "") for k in REQUIRED_KEYS}
    missing = [k for k, v in cfg.items() if not v]
    if missing:
        raise RuntimeError(f"Missing required env keys: {', '.join(missing)}")

    ok, msg = validate_mapping(cfg)
    if not ok:
        raise RuntimeError(msg)
    return cfg  # type: ignore[return-value]


def load_env(env_json: Optional[str] = None) -> Dict[str, str]:
    """Load environment either from a JSON file or layered .env files, with validation."""
    if env_json:
        return load_from_json(env_json)
    return load_layered_dotenv()
