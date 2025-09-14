from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

FORBIDDEN = re.compile(r"(\?afp=|&afp=)", re.IGNORECASE)
ALLOWED_IMPORT = (
    "from linker.builder import build_fiverr_link",
    "import linker.builder",
)

EXCLUDE_DIRS = {
    ".git",
    ".github",
    "valuex-firehose/.venv2",
    "resonance/.venv",
    "__pycache__",
    ".pytest_cache",
    "node_modules",
}

EXCLUDE_FILES = {
    # The centralized builder may contain 'afp=' literals
    str(ROOT / "valuex-firehose" / "linker" / "builder.py").replace("\\", "/"),
}

# Tests are allowed to mention '?afp=' but must import the builder
TESTS_DIR = ROOT / "valuex-firehose" / "tests"

violations: list[str] = []

for p in ROOT.rglob("**/*.py"):
    sp = str(p).replace("\\", "/")
    rel = sp.split(str(ROOT).replace("\\", "/") + "/")[-1]

    # Skip excluded dirs
    if any(part in EXCLUDE_DIRS for part in Path(rel).parts):
        continue

    # Explicitly allow builder.py
    if sp in EXCLUDE_FILES:
        continue

    try:
        text = p.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        continue

    if not FORBIDDEN.search(text):
        continue

    # If under tests, require importing builder
    if TESTS_DIR in p.parents:
        if any(imp in text for imp in ALLOWED_IMPORT):
            continue
        else:
            violations.append(rel + " (tests: missing builder import)")
            continue

    # For non-tests, require using builder explicitly
    if not any(imp in text for imp in ALLOWED_IMPORT):
        violations.append(rel)

if violations:
    print("Refuse ad-hoc `afp` usage outside builder.py:\n" + "\n".join(sorted(violations)))
    sys.exit(1)

print("OK: no ad-hoc 'afp' usage found outside builder.py")
