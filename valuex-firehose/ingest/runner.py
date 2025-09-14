from __future__ import annotations

import asyncio
import os
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Tuple, Optional

import httpx
import math
import orjson
import pandas as pd
import yaml

# Make repo root importable when running as a script
import sys
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

# Load environment variables with layering (workspace then project)
try:
    from dotenv import load_dotenv
    WORKSPACE = ROOT.parent
    # Load workspace-level defaults if present
    load_dotenv(WORKSPACE / ".env")
    # Project-level overrides
    load_dotenv(ROOT / ".env", override=True)
except Exception:
    # Optional dependency; continue if missing
    pass

# Connectors
from connectors import reddit as cx_reddit
from connectors import x_snscrape as cx_x
from connectors import hn as cx_hn
from connectors import stackoverflow as cx_so
from connectors import github as cx_gh
from connectors import rss as cx_rss
from connectors.base import Event, dedupe_hash
from demand.vectorizer import compute_demand
from offers.catalog import top_matches
from offers.linker import build_affiliate_url
from monetize.planner import plan_lead
from demand import __version__ as VEC_VER
from monetize import __version__ as PLAN_VER
from offers import __version__ as CAT_VER
from monetize.llm_triage import triage as llm_triage
CONFIG_DIR = ROOT / "config"
DATA_DIR = ROOT / "data"
OUTREACH_DIR = DATA_DIR / "outreach_drafts"

ROUTE_API = os.getenv("ROUTE_API", "http://127.0.0.1:8000")
MIN_PRIORITY = float(os.getenv("MIN_PRIORITY", "0.35"))
MONETIZE_SHADOW = os.getenv("MONETIZE_SHADOW", "1") == "1"
LEADS_V2_ONLY = os.getenv("LEADS_V2_ONLY", "0") == "1"
INGEST_METRICS_KEY = os.getenv("INGEST_METRICS_KEY", "")
LLM_TRIAGE = os.getenv("LLM_TRIAGE", "0") == "1"
LLM_TRIAGE_CENTER = float(os.getenv("LLM_TRIAGE_CENTER", "0.5"))
LLM_TRIAGE_WINDOW = float(os.getenv("LLM_TRIAGE_WINDOW", "0.1"))


def _today_str() -> str:
    return datetime.now(tz=timezone.utc).strftime("%Y%m%d")


def _ensure_dirs() -> None:
    for p in [DATA_DIR, OUTREACH_DIR, DATA_DIR / "events", DATA_DIR / "leads", DATA_DIR / "snapshots"]:
        p.mkdir(parents=True, exist_ok=True)


def _events_path() -> Path:
    return DATA_DIR / f"events_{_today_str()}.ndjson"


def _leads_path() -> Path:
    return DATA_DIR / "leads.csv"


def _leads_v2_path() -> Path:
    return DATA_DIR / "leads_v2.csv"


def _summary_path() -> Path:
    return DATA_DIR / "summary_latest.md"


def _seen_keys_path() -> Path:
    return DATA_DIR / "seen_keys.txt"


def _load_seen_keys() -> set[str]:
    p = _seen_keys_path()
    if not p.exists():
        return set()
    try:
        return set([line.strip() for line in p.read_text(encoding="utf-8").splitlines() if line.strip()])
    except Exception:
        return set()


def _append_seen_keys(keys: set[str]) -> None:
    if not keys:
        return
    p = _seen_keys_path()
    with p.open("a", encoding="utf-8") as f:
        for k in keys:
            f.write(k + "\n")


def _hours_since_iso(ts: str | None) -> float:
    if not ts:
        return 1e6
    try:
        dt = datetime.fromisoformat(str(ts).replace("Z", "+00:00"))
    except Exception:
        return 1e6
    return max(0.0, (datetime.now(timezone.utc) - dt).total_seconds() / 3600.0)


def _assert_invariants(demand_score: float, fit: float, priority: float) -> None:
    for name, val in (("demand_score", demand_score), ("fit", fit), ("priority", priority)):
        if not isinstance(val, (int, float)) or math.isnan(float(val)) or float(val) < 0.0 or float(val) > 1.0:
            raise RuntimeError(f"Invariant failed: {name}={val} out of [0,1]")


async def _with_backoff(coro_fn, *args, **kwargs):
    delays = [0.5, 1.0, 2.0]
    last_exc = None
    for d in delays:
        try:
            return await coro_fn(*args, **kwargs)
        except Exception as e:
            last_exc = e
            await asyncio.sleep(d)
    if last_exc:
        raise last_exc


async def fetch_all(sources_cfg: Dict, phrases: Dict) -> Tuple[List[Event], Dict[str, str]]:
    tasks = []
    errors: Dict[str, str] = {}

    async def wrap(name: str, fn, cfg: Dict):
        try:
            return name, await _with_backoff(fn.fetch, cfg, phrases)
        except Exception as e:
            errors[name] = f"{type(e).__name__}: {e}"
            return name, []

    if "reddit" in sources_cfg:
        tasks.append(wrap("reddit", cx_reddit, sources_cfg["reddit"]))
    if "x" in sources_cfg:
        tasks.append(wrap("x", cx_x, sources_cfg["x"]))
    if "hn" in sources_cfg:
        tasks.append(wrap("hn", cx_hn, sources_cfg["hn"]))
    if "stackoverflow" in sources_cfg:
        tasks.append(wrap("stackoverflow", cx_so, sources_cfg["stackoverflow"]))
    if "github" in sources_cfg:
        tasks.append(wrap("github", cx_gh, sources_cfg["github"]))
    if "rss" in sources_cfg:
        tasks.append(wrap("rss", cx_rss, sources_cfg["rss"]))

    results: List[Event] = []
    for coro in asyncio.as_completed([t for t in map(lambda t: t, tasks)]):
        name, part = await coro
        results.extend(part)
    return results, errors


async def score_events(events: List[Event], actionable_labels: List[str]) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    # returns (all_records, leads_records)
    all_records: List[Dict[str, Any]] = []
    leads_records: List[Dict[str, Any]] = []

    sem = asyncio.Semaphore(32)

    async with httpx.AsyncClient(timeout=20) as client:
        async def worker(ev: Event) -> Tuple[Dict[str, Any], Optional[Dict[str, Any]]]:
            async with sem:
                try:
                    r = await client.post(f"{ROUTE_API}/route", json={"text": ev.text})
                    r.raise_for_status()
                    out = r.json()
                except Exception:
                    out = {"score": 0.0, "labels": [], "topics": [], "offers": [], "explanation": {}}

                # Optional: LLM-assisted triage near score boundary (env-gated)
                triage_info = None
                try:
                    route_score_tmp = float(out.get("score", 0.0))
                except Exception:
                    route_score_tmp = 0.0
                if LLM_TRIAGE and abs(route_score_tmp - LLM_TRIAGE_CENTER) <= (LLM_TRIAGE_WINDOW / 2.0):
                    try:
                        tri = await asyncio.to_thread(llm_triage, ev.text)
                    except Exception as e:
                        tri = {"ok": False, "error": f"{type(e).__name__}: {e}"}
                    triage_info = tri

                rec = {
                    "ts": ev.ts,
                    "source": ev.source,
                    "permalink": ev.permalink,
                    "text": ev.text,
                    "score": float(out.get("score", 0.0)),
                    "labels": out.get("labels", []) or [],
                    "topics": out.get("topics", []) or [],
                    "offers": out.get("offers", []) or [],
                    "explanation": out.get("explanation", {}),
                }

                # Merge topics from triage and attach summary under explanation
                if triage_info:
                    tri_ok = bool(triage_info.get("ok"))
                    tri_res = triage_info.get("result") or {}
                    tri_topics = tri_res.get("topics") or []
                    if tri_topics and isinstance(tri_topics, list):
                        # union topics
                        rec_topics = list(dict.fromkeys(list(rec["topics"]) + [str(t) for t in tri_topics]))
                        rec["topics"] = rec_topics
                    # Attach minimal triage context (avoid huge payloads)
                    rec_expl = rec.get("explanation") or {}
                    rec_expl["llm_triage"] = {
                        "provider": triage_info.get("provider"),
                        "model": triage_info.get("model"),
                        "ok": tri_ok,
                        "route": tri_res.get("route"),
                        "angle": tri_res.get("angle"),
                        "topics": tri_topics[:10] if isinstance(tri_topics, list) else tri_topics,
                    }
                    rec["explanation"] = rec_expl

                lead_rec: Optional[Dict[str, Any]] = None
                labels = set(rec["labels"]) if rec["labels"] else set()
                actionable = labels.intersection(set(actionable_labels or []))
                if rec["score"] >= 0.5 and actionable:
                    offer_url = ""
                    offers = rec.get("offers") or []
                    if offers:
                        offer_url = offers[0].get("affiliate_url") or ""
                    lead_rec = {
                        "ts": rec["ts"],
                        "source": rec["source"],
                        "permalink": rec["permalink"],
                        "score": rec["score"],
                        "labels": "|".join(rec["labels"]),
                        "topics": "|".join(rec["topics"]),
                        "suggested_offer_url": offer_url,
                    }
                return rec, lead_rec

        results = await asyncio.gather(*(worker(ev) for ev in events))
        for rec, lead_rec in results:
            all_records.append(rec)
            if lead_rec:
                leads_records.append(lead_rec)
    return all_records, leads_records


def _shadow_enrich(records: List[Dict[str, Any]], *, min_priority: float, actionable_labels: Optional[List[str]] = None) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], float]:
    enriched: List[Dict[str, Any]] = []
    leads_v2: List[Dict[str, Any]] = []
    predicted_revenue_sum = 0.0

    for rec in records:
        # Compute demand vector and score
        dv, dscore = compute_demand({
            "ts": rec.get("ts"),
            "source": rec.get("source"),
            "text": rec.get("text", ""),
            "labels": rec.get("labels", []),
            "topics": rec.get("topics", []),
        })

        # Offer matches (constraints enforced inside)
        matches = top_matches(
            text=rec.get("text", ""),
            labels=rec.get("labels", []),
            topics=rec.get("topics", []),
            k=3,
            source=rec.get("source"),
        )
        best = matches[0] if matches else None

        # Planner
        event_for_plan = {
            "text": rec.get("text", ""),
            "labels": rec.get("labels", []),
            "topics": rec.get("topics", []),
            "source": rec.get("source"),
            "demand_vector": dv,
            "age_hours": _hours_since_iso(rec.get("ts")),
        }
        plan = plan_lead(event_for_plan, best)

        best_fit = float(best.get("fit", 0.0)) if best else 0.0
        route_score = float(rec.get("score", 0.0))
        # Base priority combines demand, route score, and offer fit
        priority_base = max(0.0, min(1.0, 0.5 * dscore + 0.3 * route_score + 0.2 * best_fit))

        # Actionability factor: downweight when route score is weak or actionable labels absent
        rec_labels = set(rec.get("labels", []) or [])
        actionable_set = set(actionable_labels or [])
        has_actionable = bool(rec_labels & actionable_set) if actionable_set else False
        actionability_factor = 1.0
        reasons: List[str] = []
        if route_score < 0.5:
            actionability_factor *= 0.7
            reasons.append("route<0.5")
        if not has_actionable:
            actionability_factor *= 0.6
            reasons.append("no_actionable")

        priority = max(0.0, min(1.0, priority_base * actionability_factor))
        _assert_invariants(dscore, best_fit, priority)

        # Prediction: simple fit-weighted EPC
        epc = float(best.get("epc_est", 0.0)) if best else 0.0
        pred_rev = float(epc) * float(best_fit)

        monetization = {
            "offers": matches,
            "best_offer": best,
            "plan": plan,
            "priority": round(priority, 3),
            "priority_components": {
                "demand": round(float(dscore), 3),
                "route": round(route_score, 3),
                "fit": round(best_fit, 3),
                "base": round(priority_base, 3),
                "actionability_factor": round(actionability_factor, 3),
                "reasons": reasons,
                "final": round(priority, 3),
                "has_actionable_label": has_actionable,
            },
            "prediction": {
                "fit": round(best_fit, 3),
                "epc_est": round(epc, 3),
                "pred_rev": round(pred_rev, 3),
            },
            "angle_tag": plan.get("angle_tag"),
            "versions": {"vectorizer": VEC_VER, "planner": PLAN_VER, "catalog": CAT_VER},
        }

        new_rec = dict(rec)
        new_rec["demand_vector"] = dv
        new_rec["demand_score"] = round(float(dscore), 3)
        new_rec["monetization"] = monetization
        enriched.append(new_rec)

        if priority >= min_priority:
            # Build monetizable URL for best offer (if any)
            aff_url = ""
            if best:
                try:
                    aff_url = build_affiliate_url(best, labels=rec.get("labels", []), topics=rec.get("topics", []), source=rec.get("source"))
                except Exception:
                    aff_url = ""

            row = {
                "ts": rec.get("ts"),
                "source": rec.get("source"),
                "permalink": rec.get("permalink"),
                "priority": round(priority, 3),
                "demand_score": round(float(dscore), 3),
                "route_score": round(route_score, 3),
                "angle_tag": plan.get("angle_tag"),
                "top_fit": round(best_fit, 3),
                "offer_id": (best or {}).get("offer_id", ""),
                "merchant": (best or {}).get("merchant", ""),
                "offer_url": aff_url,
                "prediction": round(pred_rev, 3),
            }
            predicted_revenue_sum += pred_rev
            leads_v2.append(row)

    return enriched, leads_v2, round(predicted_revenue_sum, 3)


def _write_ndjson(path: Path, records: List[Dict[str, Any]]) -> None:
    with path.open("a", encoding="utf-8") as f:
        for rec in records:
            f.write(orjson.dumps(rec).decode("utf-8"))
            f.write("\n")


def _append_leads_csv(path: Path, leads: List[Dict[str, Any]]) -> None:
    if not leads:
        return
    df = pd.DataFrame.from_records(leads)
    header = not path.exists()
    df.to_csv(path, mode="a", header=header, index=False)


def _append_leads_v2_csv(path: Path, leads_v2: List[Dict[str, Any]]) -> None:
    if not leads_v2:
        return
    df = pd.DataFrame.from_records(leads_v2)
    header = not path.exists()
    df.to_csv(path, mode="a", header=header, index=False)


def _write_outreach_drafts(leads: List[Dict[str, Any]]) -> None:
    day = datetime.now(tz=timezone.utc).strftime("%y%m%d")
    outdir = OUTREACH_DIR / day
    outdir.mkdir(parents=True, exist_ok=True)
    for lead in leads:
        topic = (lead.get("topics") or "").split("|")[0] if isinstance(lead.get("topics"), str) else (lead.get("topics") or [])
        if isinstance(topic, list):
            topic = topic[0] if topic else "your topic"
        topic = topic or "your topic"
        url = lead.get("suggested_offer_url") or ""
        permalink = lead.get("permalink") or ""
        key = dedupe_hash(lead.get("permalink") or "", lead.get("ts") or "")[:16]
        msg = (
            f"Saw your post about {topic}. Quick pointer: this page/service solves the problem. "
            f"If helpful, here’s a link: {url}. If not, ignore — wishing you a fast fix.\n\n"
            f"Permalink: {permalink}\n"
        )
        (outdir / f"{key}.txt").write_text(msg, encoding="utf-8")


def _write_summary(path: Path, by_source: Counter, leads: List[Dict[str, Any]], errors: Dict[str, str]) -> None:
    top = sorted(leads, key=lambda x: x.get("score", 0), reverse=True)[:10]
    lines = []
    lines.append(f"# Firehose Summary ({datetime.now(tz=timezone.utc).isoformat()})\n")
    lines.append("\n## New items fetched per source\n")
    for s, c in by_source.items():
        lines.append(f"- {s}: {c}")
    lines.append("\n## Leads generated\n")
    lines.append(f"- Total: {len(leads)}\n")
    for i, l in enumerate(top, 1):
        lines.append(f"{i}. [{l.get('permalink')}] score={l.get('score')} labels={l.get('labels')} offer={l.get('suggested_offer_url')}")
    if errors:
        lines.append("\n## Connector failures\n")
        for k, v in errors.items():
            lines.append(f"- {k}: {v}")
    lines.append("\n## TODOs for next pass\n")
    lines.append("- Tune queries per source\n- Expand phrase bank\n- Improve dedupe across days\n")
    path.write_text("\n".join(lines), encoding="utf-8")


def _manifest_path() -> Path:
    ts = datetime.now(tz=timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    return DATA_DIR / "snapshots" / f"run_manifest_{ts}.json"


def _write_manifest(path: Path, manifest: Dict[str, Any]) -> None:
    try:
        path.write_text(orjson.dumps(manifest, option=orjson.OPT_INDENT_2).decode("utf-8"), encoding="utf-8")
    except Exception:
        # Fallback minimal write
        path.write_text(str(manifest), encoding="utf-8")


async def main() -> None:
    _ensure_dirs()
    phrases = yaml.safe_load((CONFIG_DIR / "phrases.yaml").read_text(encoding="utf-8"))
    sources_cfg = yaml.safe_load((CONFIG_DIR / "sources.yaml").read_text(encoding="utf-8"))

    events, errors = await fetch_all(sources_cfg, phrases)

    # Cross-day dedupe using persistent seen store
    seen_persistent = _load_seen_keys()
    seen_session = set()
    new_keys: set[str] = set()
    deduped: List[Event] = []
    for ev in events:
        h = dedupe_hash(ev.text, ev.permalink)
        if (h in seen_persistent) or (h in seen_session):
            continue
        seen_session.add(h)
        new_keys.add(h)
        deduped.append(ev)

    by_source = Counter([e.source for e in deduped])

    all_records, leads_records = await score_events(deduped, phrases.get("actionable_labels", []))

    # Defaults to avoid undefined references when shadow mode is off
    enriched_records = all_records
    leads_v2: List[Dict[str, Any]] = []
    pred_rev_sum = 0.0
    if MONETIZE_SHADOW:
        # Shadow enrichment (Stage 1)
        enriched_records, leads_v2, pred_rev_sum = _shadow_enrich(
            all_records,
            min_priority=MIN_PRIORITY,
            actionable_labels=phrases.get("actionable_labels", []),
        )
        # Write enriched NDJSON
        _write_ndjson(_events_path(), enriched_records)
        # Legacy CSV (unless LEADS_V2_ONLY)
        if not LEADS_V2_ONLY:
            _append_leads_csv(_leads_path(), leads_records)
        # Leads v2 CSV (gated by min priority)
        if leads_v2:
            _append_leads_v2_csv(_leads_v2_path(), leads_v2)
    else:
        # No enrichment; write original NDJSON and legacy CSV only
        _write_ndjson(_events_path(), all_records)
        _append_leads_csv(_leads_path(), leads_records)

    _write_outreach_drafts(leads_records)
    _write_summary(_summary_path(), by_source, leads_records, errors)

    # Snapshot manifest and persist seen keys
    _append_seen_keys(new_keys)
    manifest = {
        "ts": datetime.now(tz=timezone.utc).isoformat(),
        "total_fetched": len(events),
        "after_dedupe": len(deduped),
        "new_keys": len(new_keys),
        "dedupe_rate": (1.0 - (len(deduped) / len(events))) if events else 0.0,
        "by_source": dict(by_source),
        "errors": errors,
        "monetization": (
            {
                "versions": {"vectorizer": VEC_VER, "planner": PLAN_VER, "catalog": CAT_VER},
                "min_priority": MIN_PRIORITY,
                "shadow_mode": MONETIZE_SHADOW,
                "enriched_records": len(enriched_records),
                "shadow_candidates": len(leads_v2),
                "predicted_revenue_sum": pred_rev_sum,
                "leads_v2_only": LEADS_V2_ONLY,
            }
            if MONETIZE_SHADOW
            else {"shadow_mode": False}
        ),
    }
    _write_manifest(_manifest_path(), manifest)

    # Optional: send ingestion metrics to app metrics endpoint
    try:
        if INGEST_METRICS_KEY:
            payload = {
                "events_fetched": dict(by_source),
                "leads_emitted": len(leads_records),
                "shadow_leads": len(leads_v2),
                "predicted_revenue_sum": pred_rev_sum,
            }
            async with httpx.AsyncClient(timeout=10) as client:
                await client.post(f"{ROUTE_API}/ingest_metrics", json=payload, headers={"X-Ingest-Key": INGEST_METRICS_KEY})
    except Exception:
        pass


if __name__ == "__main__":
    asyncio.run(main())
