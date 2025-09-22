"""
Agent Hub (design-first stub).

Decision order per spoke:
1) Use official API if available & permitted.
2) Else fetch public permalink (no login) and parse.
3) Else fall back to agentic browser (Stagehand+Playwright) for human-like flows.

Notes:
- US-only lanes; US-CA stricter.
- Respect robots.txt.
- Cap concurrent tabs; pause on CPU > 85% > 5m.
"""

from typing import Literal, Dict, Any

Mode = Literal["api", "public", "agentic"]

def choose_path(spoke: str, capabilities: Dict[str, bool]) -> Mode:
    """Return the chosen path for a spoke given capabilities."""
    if capabilities.get("api"):
        return "api"
    if capabilities.get("public"):
        return "public"
    if capabilities.get("agentic"):
        return "agentic"
    raise RuntimeError(f"No allowed path for {spoke}")

def explain_choice(spoke: str, mode: Mode) -> str:
    """Provide a short policy explanation for logs."""
    return f"{spoke}: using {mode} per policy (api>public>agentic), US lane."
