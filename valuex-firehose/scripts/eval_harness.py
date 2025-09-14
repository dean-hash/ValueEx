from __future__ import annotations

import argparse
import asyncio
import csv
import json
import os
import sys
from dataclasses import asdict
from typing import Any, Dict, List, Tuple, Optional, Set

import yaml

# Ensure repo root is on sys.path so local packages are importable when run as a script
ROOT = os.path.dirname(os.path.dirname(__file__))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

# Load environment variables (workspace -> resonance -> project) so affiliate links are available
try:
    from dotenv import load_dotenv  # type: ignore
    WORKSPACE = os.path.dirname(ROOT)
    # Workspace-level defaults
    load_dotenv(os.path.join(WORKSPACE, ".env"))
    # resonance/.env where affiliate creds are stored
    load_dotenv(os.path.join(WORKSPACE, "resonance", ".env"))
    # Project-level overrides
    load_dotenv(os.path.join(ROOT, ".env"), override=True)
except Exception:
    # Optional dependency; continue if missing
    pass

# Local imports (after sys.path adjustment)
from connectors import reddit, hn, rss, github, stackoverflow
try:
    from connectors import x_snscrape as xmod  # optional
except Exception:  # pragma: no cover
    xmod = None  # type: ignore

from connectors.base import Event, dedupe_hash

# Use router logic offline (no server)
from app import main as router
from monetize.llm_triage import triage as llm_triage

DATA_DIR = os.path.join(ROOT, "data", "eval")
CONFIG_DIR = os.path.join(ROOT, "config")
PHRASES_PATH = os.path.join(CONFIG_DIR, "phrases.yaml")
SOURCES_PATH = os.path.join(CONFIG_DIR, "sources.yaml")
STRICT_FIT_THRESHOLD = float(os.environ.get("STRICT_FIT_THRESHOLD", 0.30))
SEEN_PATH = os.path.join(DATA_DIR, "seen_permalinks.txt")


def ensure_dirs() -> None:
    os.makedirs(DATA_DIR, exist_ok=True)


def _load_seen_permalinks() -> Set[str]:
    if not os.path.exists(SEEN_PATH):
        return set()
    try:
        with open(SEEN_PATH, "r", encoding="utf-8") as f:
            return {line.strip() for line in f if line.strip()}
    except Exception:
        return set()


def _append_seen_permalinks(permalinks: List[str]) -> None:
    if not permalinks:
        return
    with open(SEEN_PATH, "a", encoding="utf-8") as f:
        for p in permalinks:
            f.write(str(p).strip() + "\n")


def load_cfg() -> Tuple[Dict[str, Any], Dict[str, Any]]:
    with open(PHRASES_PATH, "r", encoding="utf-8") as f:
        phrases = yaml.safe_load(f) or {}
    with open(SOURCES_PATH, "r", encoding="utf-8") as f:
        sources = yaml.safe_load(f) or {}
    return phrases, sources


async def collect_events(selected: List[str], limit: int, phrases: Dict[str, Any], sources: Dict[str, Any], seen_permalinks: Optional[Set[str]] = None) -> List[Event]:
    tasks = []
    # Map source name -> (module, cfg)
    mapping: Dict[str, Tuple[Any, Dict[str, Any]]] = {
        "reddit": (reddit, sources.get("reddit", {})),
        "hn": (hn, sources.get("hn", {})),
        "rss": (rss, sources.get("rss", {})),
        "github": (github, sources.get("github", {})),
        "stackoverflow": (stackoverflow, sources.get("stackoverflow", {})),
    }
    if xmod is not None:
        mapping["x"] = (xmod, sources.get("x", {}))

    for name in selected:
        mod_cfg = mapping.get(name)
        if not mod_cfg:
            continue
        mod, cfg = mod_cfg
        # Clamp connector-specific limits to reduce load
        cfg = dict(cfg or {})
        if name in ("reddit", "github", "stackoverflow", "hn", "rss"):
            if "limit" in cfg:
                cfg["limit"] = min(int(cfg.get("limit", limit)), max(10, limit))
        if name == "x":
            cfg["max_results"] = min(int(cfg.get("max_results", limit)), max(10, limit))
        tasks.append(mod.fetch(cfg, phrases))

    results: List[Event] = []
    for coro in asyncio.as_completed(tasks):
        try:
            part = await coro
            results.extend(part or [])
        except Exception:
            continue

    # Dedupe and cap total
    seen = set()
    out: List[Event] = []
    for e in results:
        # Across-run dedupe by permalink (optional)
        if seen_permalinks and (e.permalink in seen_permalinks):
            continue
        h = dedupe_hash(e.text, e.permalink)
        if h in seen:
            continue
        seen.add(h)
        out.append(e)
        if len(out) >= limit:
            break
    return out


def score_and_route(text: str, *, use_triage: bool = False, triage_center: float = 0.5, triage_window: float = 0.1) -> Tuple[float, List[str], List[str], List[Dict[str, Any]], Dict[str, Any]]:
    labels = router.detect_labels(text)
    topics = router.detect_topics(text)

    # Copy the scoring logic from app.main.route
    score = 0.05
    components: Dict[str, float] = {}
    if "repair_or_fix" in labels:
        components["repair_or_fix"] = components.get("repair_or_fix", 0.0) + 0.25
        score += 0.25
    if "urgent_service" in labels:
        components["urgent_service"] = components.get("urgent_service", 0.0) + 0.2
        score += 0.2
    if "hire_freelancer" in labels:
        components["hire_freelancer"] = components.get("hire_freelancer", 0.0) + 0.2
        score += 0.2
    if "comparison_or_buying" in labels:
        components["comparison_or_buying"] = components.get("comparison_or_buying", 0.0) + 0.1
        score += 0.1
    if topics:
        components["topic_present"] = components.get("topic_present", 0.0) + 0.2
        score += 0.2
    if labels and topics:
        components["label_topic_combo"] = components.get("label_topic_combo", 0.0) + 0.05
        score += 0.05

    t = (text or "").lower()
    negative_hits = [w for w in router.NEGATIVE_WORDS if w in t]
    if negative_hits:
        components["negative_words"] = components.get("negative_words", 0.0) - 0.25
        score -= 0.25

    info_hits = [w for w in router.INFO_WORDS if w in t]
    if info_hits:
        components["informational_words"] = components.get("informational_words", 0.0) - 0.15
        score -= 0.15

    score = max(0.0, min(1.0, score))

    # Optional: LLM-assisted triage near score boundary
    triage_info: Optional[Dict[str, Any]] = None
    if use_triage and abs(score - float(triage_center)) <= (float(triage_window) / 2.0):
        try:
            tri = llm_triage(text)
        except Exception as e:
            tri = {"ok": False, "error": f"{type(e).__name__}: {e}"}
        tri_res = tri.get("result") or {}
        tri_topics = tri_res.get("topics") or []
        if tri_topics and isinstance(tri_topics, list):
            topics = list(dict.fromkeys(list(topics) + [str(t) for t in tri_topics]))
        triage_info = {
            "provider": tri.get("provider"),
            "model": tri.get("model"),
            "ok": bool(tri.get("ok")),
            "route": tri_res.get("route"),
            "angle": tri_res.get("angle"),
            "topics": tri_topics[:10] if isinstance(tri_topics, list) else tri_topics,
        }

    offers = router.choose_offers(text, labels, topics)

    # Constrain to actionable labels subset
    actionable = router.ACTIONABLE or []
    if actionable:
        labels = [l for l in labels if l in actionable]

    def _hits(words: List[str]) -> List[str]:
        return [w for w in words if w in t]

    explanation = {
        "hits": {
            "repair_or_fix": _hits(router.REPAIR_WORDS),
            "urgent_service": _hits(router.URGENT_WORDS),
            "hire_freelancer": _hits(router.HIRE_WORDS),
            "comparison_or_buying": _hits(router.COMPARE_WORDS),
            "negative_words": negative_hits,
            "informational_words": _hits(router.INFO_WORDS),
        },
        "topics": topics,
        "score_components": components,
    }
    if triage_info:
        explanation["llm_triage"] = triage_info
    return score, labels, topics, offers, explanation


def write_eval_csv(path: str, rows: List[Dict[str, Any]]) -> None:
    fieldnames = [
        "source",
        "ts",
        "permalink",
        "text",
        "labels",
        "topics",
        "score",
        "offers_count",
        "top_offer_merchant",
        "top_offer_epc_est",
        "top_offer_fit",
        "top_offer_rationale",
        "top_offer_url",
        "triage_provider",
        "triage_model",
        "triage_route",
        "triage_angle",
        "triage_topics",
    ]
    with open(path, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        for r in rows:
            w.writerow({k: r.get(k, "") for k in fieldnames})


def write_summary(path: str, rows: List[Dict[str, Any]]) -> None:
    total = len(rows)
    actionable = sum(1 for r in rows if (r.get("labels") or "").strip())
    have_offer = sum(1 for r in rows if int(r.get("offers_count") or 0) > 0)
    have_offer_strict = sum(
        1
        for r in rows
        if (
            int(r.get("offers_count") or 0) > 0
            and (r.get("labels") or "").strip()
            and (float(r.get("top_offer_fit") or 0.0) >= STRICT_FIT_THRESHOLD)
        )
    )
    pct = lambda x: f"{(100.0 * x/total):.1f}%" if total else "0.0%"

    # By source
    by_src: Dict[str, int] = {}
    for r in rows:
        s = r.get("source") or ""
        by_src[s] = by_src.get(s, 0) + 1

    lines = [
        f"total={total}",
        f"actionable_labels={actionable} ({pct(actionable)})",
        f"with_offers={have_offer} ({pct(have_offer)})",
        f"with_offers_strict={have_offer_strict} ({pct(have_offer_strict)})  # fit>={STRICT_FIT_THRESHOLD:.2f} & actionable",
        "sources=" + ", ".join(f"{k}:{v}" for k, v in sorted(by_src.items())),
    ]
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")


def init_golden_csv(path: str, rows: List[Dict[str, Any]], n: int = 20, refresh: bool = False) -> None:
    if os.path.exists(path) and not refresh:
        return  # don't overwrite
    sel = sorted(rows, key=lambda r: float(r.get("score") or 0.0), reverse=True)[:n]
    fields = [
        "source",
        "permalink",
        "text",
        "topics",
        "top_offer_merchant",
        "top_offer_url",
        "triage_route",
        "triage_angle",
        "triage_topics",
        "offer_ok",  # yes/no (to be filled manually)
    ]
    with open(path, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for r in sel:
            w.writerow({
                "source": r.get("source", ""),
                "permalink": r.get("permalink", ""),
                "text": r.get("text", "")[:300],
                "topics": r.get("topics", ""),
                "top_offer_merchant": r.get("top_offer_merchant", ""),
                "top_offer_url": r.get("top_offer_url", ""),
                "triage_route": r.get("triage_route", ""),
                "triage_angle": r.get("triage_angle", ""),
                "triage_topics": r.get("triage_topics", ""),
                "offer_ok": "",  # to be filled by reviewer
            })


async def main_async(args) -> int:
    ensure_dirs()
    phrases, sources = load_cfg()

    # Resolve sources list
    if args.sources == "all":
        srcs = ["reddit", "hn", "stackoverflow", "github", "rss"]
        if xmod is not None:
            srcs.append("x")
    else:
        srcs = [s.strip() for s in args.sources.split(",") if s.strip()]

    seen_permalinks = _load_seen_permalinks()
    events = await collect_events(srcs, args.limit, phrases, sources, seen_permalinks)

    rows: List[Dict[str, Any]] = []
    for ev in events:
        score, labels, topics, offers, explanation = score_and_route(
            ev.text,
            use_triage=args.use_triage,
            triage_center=args.triage_center,
            triage_window=args.triage_window,
        )
        top_offer = offers[0] if offers else {}
        tri = (explanation.get("llm_triage") or {}) if isinstance(explanation, dict) else {}
        rows.append({
            "source": ev.source,
            "ts": ev.ts,
            "permalink": ev.permalink,
            "text": ev.text[:500],
            "labels": ";".join(labels),
            "topics": ";".join(topics),
            "score": f"{score:.3f}",
            "offers_count": str(len(offers)),
            "top_offer_merchant": str(top_offer.get("merchant", "")),
            "top_offer_epc_est": str(top_offer.get("epc_est", "")),
            "top_offer_fit": str(top_offer.get("fit", "")),
            "top_offer_rationale": str(top_offer.get("rationale", "")),
            "top_offer_url": str(top_offer.get("affiliate_url", "")),
            "triage_provider": str(tri.get("provider", "")),
            "triage_model": str(tri.get("model", "")),
            "triage_route": str(tri.get("route", "")),
            "triage_angle": str(tri.get("angle", "")),
            "triage_topics": ";".join([str(t) for t in (tri.get("topics") or [])]) if isinstance(tri.get("topics"), list) else str(tri.get("topics", "")),
        })

    write_eval_csv(args.csv, rows)
    write_summary(args.summary, rows)
    init_golden_csv(args.golden, rows, n=20, refresh=args.refresh_golden)
    if args.refresh_golden:
        # Persist permalinks used in the new golden set to avoid repeats in future runs
        sel = sorted(rows, key=lambda r: float(r.get("score") or 0.0), reverse=True)[:20]
        _append_seen_permalinks([r.get("permalink", "") for r in sel if r.get("permalink")])

    print(f"Wrote {len(rows)} rows to {args.csv}")
    print(f"Summary: {args.summary}")
    if not os.path.exists(args.golden):
        # unlikely as we create it above when missing
        pass
    print(f"Golden scaffold (review 20 rows): {args.golden}")
    return 0


def parse_args():
    p = argparse.ArgumentParser(description="ValueX evaluation harness (offline)")
    p.add_argument("--limit", type=int, default=50, help="Total events across sources")
    p.add_argument(
        "--sources",
        type=str,
        default="reddit,hn,stackoverflow,github,rss",
        help="Comma-separated sources or 'all' to include X (snscrape) if available",
    )
    p.add_argument("--csv", type=str, default=os.path.join(DATA_DIR, "eval.csv"))
    p.add_argument("--summary", type=str, default=os.path.join(DATA_DIR, "summary.txt"))
    p.add_argument("--golden", type=str, default=os.path.join(DATA_DIR, "golden.csv"))
    p.add_argument("--refresh-golden", action="store_true", help="Regenerate golden.csv even if it exists and persist its permalinks to seen list")
    p.add_argument("--use-triage", action="store_true", help="Call LLM triage near score boundary and include outputs in eval rows")
    p.add_argument("--triage-center", type=float, default=float(os.environ.get("LLM_TRIAGE_CENTER", 0.5)))
    p.add_argument("--triage-window", type=float, default=float(os.environ.get("LLM_TRIAGE_WINDOW", 0.1)))
    return p.parse_args()


def main() -> int:
    args = parse_args()
    try:
        return asyncio.run(main_async(args))
    except KeyboardInterrupt:
        return 130


if __name__ == "__main__":
    raise SystemExit(main())
