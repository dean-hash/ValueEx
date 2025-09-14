# ValueX Codebase Snapshot (No-Git)

Generated: 2025-09-08 12:04:53
Root: `C:\ValueX`

## Stats
  - python: 77
  - json: 35
  - yaml: 8
  - markdown: 6
  - toml: 2
  - ps1: 1

- Files scanned: **129**


## Likely entrypoints
- audit\valuex_audit.py
- audit\valuex_audit_novenv.py
- resonance\scripts\affiliate_refresh.py
- resonance\scripts\check_affiliates.py
- resonance\scripts\digest_daily.py
- resonance\scripts\dns_apply.py
- resonance\scripts\dns_check.py
- resonance\scripts\doctor.py
- resonance\scripts\ingest_github_issues.py
- resonance\scripts\ingest_hn.py
- resonance\scripts\ingest_jsonld_sample.py
- resonance\scripts\ingest_linkedin_search.py
- resonance\scripts\ingest_reddit.py
- resonance\scripts\ingest_suggest.py
- resonance\scripts\ingest_x.py
- … (+14 more)

## Frameworks detected
- fastapi

## Crawling libs detected
- cheerio
- crawl4ai
- playwright
- puppeteer

## DB libs detected
- mongo
- sqlite

## Orphan candidate files (no inbound references)
- resonance\utils\godaddy_dns.py
- resonance\valuex_resonance\pipeline.py
- tools\lint_no_afp_outside_builder.py
- valuex-firehose\app\inbound.py
- valuex-firehose\app\metrics.py
- valuex-firehose\config\load_env.py
- valuex-firehose\connectors\github.py
- valuex-firehose\connectors\hn.py
- valuex-firehose\connectors\reddit.py
- valuex-firehose\connectors\rss.py
- valuex-firehose\connectors\stackoverflow.py
- valuex-firehose\connectors\x_snscrape.py
- valuex-firehose\demand\vectorizer.py
- valuex-firehose\linker\builder.py
- valuex-firehose\mailer\sender.py
- … (+14 more)

## Duplicate files (hash-matches)
- resonance\data\status\_latest-20250822T155327Z.json, resonance\data\status\_latest.json

## TODO / FIXME (first 15)
- audit\todos.json:5 — "text": "if \"TODO\" in text or \"FIXME\" in text:"
- audit\todos.json:10 — "text": "if \"TODO\" in line or \"FIXME\" in line:"
- audit\todos.json:15 — "text": "summary.append(\"## TODO / FIXME (first 15)\\n\" + short_list([f\"{t['file']}:{t['line']} \u2014 {t['text']}\" for t in todos], limit=15))"
- audit\todos.json:20 — "text": "with suppress(Exception):  # FIXME: log this somehow?"
- audit\todos.json:25 — "text": "# TODO: actual types are:"
- audit\todos.json:30 — "text": "# FIXME: session is None in tests only, need to fix tests"
- audit\todos.json:35 — "text": "# TODO: Fix session=None in tests (see ClientRequest.__init__)."
- audit\todos.json:40 — "text": "# FIXME cgi.FieldStorage doesn't likes body parts with"
- audit\todos.json:45 — "text": "# TODO(PY311): username = login or account"
- audit\todos.json:50 — "text": "# TODO(PY311): Remove this, as password will be empty string"
- audit\todos.json:55 — "text": "# TODO: size is ignored, remove the param later"
- audit\todos.json:60 — "text": "# TODO: should be `if` instead of `while`"
- audit\todos.json:65 — "text": "# TODO: should be `if` instead of `while`"
- audit\todos.json:70 — "text": "# TODO add async def readuntil"
- audit\todos.json:75 — "text": "# FIXME: this should include a date or etag header"
- … (+409 more)

## Components (heuristic)

### ops
- .github\workflows\valuex-firehose-ci.yml

### ui
- audit\components.json
- tools\lint_no_afp_outside_builder.py
- valuex-firehose\linker\builder.py

### data
- resonance\data\cache\awin\programmes_1771290_1.json
- resonance\data\cache\awin\programmes_671175_1.json
- resonance\data\cache\awin\programmes_679413_1.json
- resonance\data\offers\awin\offers.json
- resonance\data\samples\awin_offers.json
- resonance\data\status\_latest-20250820T162958Z.json
- resonance\data\status\_latest-20250820T164315Z.json
- resonance\data\status\_latest-20250820T193326Z.json
- resonance\data\status\_latest-20250822T155327Z.json
- resonance\data\status\_latest.json
- resonance\data\status\awin_offers.status.json
- resonance\data\status\digest_daily.status.json
- … (+17 more)

### router
- resonance\data\offers\awin\offers.json
- resonance\data\samples\awin_offers.json
- resonance\data\status\awin_offers.status.json
- resonance\valuex_resonance\match_offers.py
- valuex-firehose\config\offers.seed.yaml
- valuex-firehose\config\offers.yaml
- valuex-firehose\offers\__init__.py
- valuex-firehose\offers\awin.py
- valuex-firehose\offers\catalog.py
- valuex-firehose\offers\linker.py
- valuex-firehose\tests\test_vectorizer_offers.py

### tests
- resonance\data\status\_latest-20250820T162958Z.json
- resonance\data\status\_latest-20250820T164315Z.json
- resonance\data\status\_latest-20250820T193326Z.json
- resonance\data\status\_latest-20250822T155327Z.json
- resonance\data\status\_latest.json
- resonance\scripts\_test_canonicalization.py
- valuex-firehose\data\summary_latest.md
- valuex-firehose\tests\conftest.py
- valuex-firehose\tests\test_env_schema_validation.py
- valuex-firehose\tests\test_fiverr_append_afp_preserves_invariants.py
- valuex-firehose\tests\test_fiverr_exact_return_if_afp_present.py
- valuex-firehose\tests\test_isolation_awin_fiverr.py
- … (+4 more)

### ingest
- resonance\scripts\ingest_github_issues.py
- resonance\scripts\ingest_hn.py
- resonance\scripts\ingest_jsonld_sample.py
- resonance\scripts\ingest_linkedin_search.py
- resonance\scripts\ingest_reddit.py
- resonance\scripts\ingest_suggest.py
- resonance\scripts\ingest_x.py
- valuex-firehose\connectors\x_snscrape.py
- valuex-firehose\ingest\runner.py


## What to do next (thin slice)
1. Confirm one entrypoint to run.
2. Choose one path ingest → score → route already present.
3. Quarantine orphans/dups not needed for that path.
4. Define a thin-slice test and ship.
