# Linker Contract

Source of truth for affiliate link handling in `valuex-firehose`.

- Canonical module: `valuex-firehose/linker/builder.py`
- Workspace reference: see `ARCHITECTURE.md` (Affiliate Link Centralization)

## Inputs

- Native Fiverr offer URL from env/config.
- `afp` value (subtracking) from env.
- Optional AWIN inputs for non-Fiverr merchants: destination URL, merchant name, optional `clickref`, optional `awinmid` override.

## Outputs

- For Fiverr: either the identical input URL, or the same URL with a single `afp` key appended.
- For AWIN: an `https://www.awin1.com/cread.php?...` tracking URL when explicitly constructed, or the same AWIN URL with a `clickref` appended when missing.

## Invariants

- No-dupe: if `afp` is present, return the input URL byte-for-byte.
- No-reorder: do not change the order of existing query params.
- Encoding-stable: do not normalize percent-encoding (`%20` vs `+`) and do not alter host/path casing.
- Fragment fidelity: preserve the fragment bytes and position exactly.
- Isolation: AWIN logic must not wrap native Fiverr URLs implicitly. Fiverr builder must no-op on AWIN tracking URLs.

## Allowed Transforms

- Fiverr: only append `afp` when missing.
- AWIN: append `clickref` when missing (AWIN links only), or build `cread.php` when explicitly requested for joined merchants.

## Functions

- `is_awin_tracking_url(url: str) -> bool` — recognize AWIN tracking hosts and `cread.php`.
- `build_fiverr_link(url: str, afp: str) -> str` — return URL unchanged if `afp` present or AWIN link; else append `afp` without altering existing bytes.
- `append_awin_clickref(url: str, clickref: Optional[str]) -> str` — append `clickref` to AWIN tracking URL when missing; otherwise no-op.
- `build_awin_link(dest_url: str, merchant_name: str, *, clickref: Optional[str] = None, awinmid: Optional[str] = None, publisher_id: Optional[str] = None) -> str` — construct `cread.php` link; never for Fiverr.

## Tests

- See `valuex-firehose/tests/`:
  - `test_fiverr_exact_return_if_afp_present.py`
  - `test_fiverr_append_afp_preserves_invariants.py`
  - `test_isolation_awin_fiverr.py`
  - `test_env_schema_validation.py`

## Verification Manifest

- Script: `valuex-firehose/scripts/verify_fiverr_links.py`
- Loads env via `config/load_env.py` (JSON fixture or layered .envs).
- Emits JSONL at `valuex-firehose/data/verify_fiverr.jsonl` with fields:
  - `input_url`, `output_url`, `transformation` ("identity" | "append_afp"), `rule_id` ("fiverr.append_afp"), `notes`.
- Exits non-zero if any transformation is not "identity" or "append_afp".

## Anti-duplication Guard

- `tools/lint_no_afp_outside_builder.py` fails CI if any code appends `afp` outside `builder.py` (tests must import the builder when containing `afp` literals).

## How to Run

```bash
# From workspace root
# (1) Install deps in firehose venv
python valuex-firehose/.venv2/Scripts/pip.exe install -r valuex-firehose/requirements.txt

# (2) Run tests
python valuex-firehose/.venv2/Scripts/python.exe -m pytest -q valuex-firehose

# (3) Verification manifest using fixture
$env:ENV_JSON = "c:\\ValueX\\valuex-firehose\\config\\env.fixture.json"; \
  python valuex-firehose/.venv2/Scripts/python.exe valuex-firehose/scripts/verify_fiverr_links.py
```
