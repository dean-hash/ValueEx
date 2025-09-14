#!/usr/bin/env python3
# ValueX thin-slice demo (offline). Writes only to ./audit/
# - Reads sample leads from resonance/data/samples/x_search.jsonl (if present)
# - Parses offers from valuex-firehose/config/offers.yaml (naive subset parser)
# - Produces simple "cards" with a best-effort keyword match to an offer
# - Also emits a Slack-ready blocks payload

import json, re, time
from pathlib import Path

WS = Path(__file__).resolve().parent.parent
OUT = WS / "audit"; OUT.mkdir(exist_ok=True)
CARDS_FILE = OUT / "thin_slice_cards.json"
SLACK_FILE = OUT / "thin_slice_slack.json"

def load_leads(max_items=5):
    p = WS / "resonance" / "data" / "samples" / "x_search.jsonl"
    leads = []
    if p.exists():
        for line in p.read_text(encoding="utf-8").splitlines():
            if not line.strip(): continue
            try:
                d = json.loads(line)
            except Exception:
                continue
            text = d.get("text") or ""
            title = text.split("\n")[0][:180] if text else (d.get("title") or "(no title)")
            leads.append({
                "title": title,
                "url": d.get("url") or "",
                "source": "x:sample",
                "text": text,
            })
            if len(leads) >= max_items:
                break
    if not leads:
        # minimal offline fallback
        leads = [
            {"title": "Hiring WordPress dev for plugin cleanup", "url": "", "source": "sample", "text": "Need wordpress plugin fix urgent"},
            {"title": "Shopify theme tweaks needed", "url": "", "source": "sample", "text": "looking for shopify expert to fix theme"},
            {"title": "Logo & brand kit help", "url": "", "source": "sample", "text": "brand identity webflow site refresh"},
        ]
    return leads

def load_offers():
    y = WS / "valuex-firehose" / "config" / "offers.yaml"
    offers = []
    if y.exists():
        cur = {}
        in_urls = False
        for raw in y.read_text(encoding="utf-8").splitlines():
            s = raw.strip()
            if s.startswith("- id:"):
                if cur: offers.append(cur); cur = {}
                cur = {"id": s.split(":",1)[1].strip(), "categories": [], "landing_urls": []}
                in_urls = False
            elif s.startswith("categories: ["):
                arr = s[s.find("[")+1:s.find("]")]
                cats = [t.strip() for t in arr.split(",") if t.strip()]
                cur["categories"] = cats
            elif s.startswith("landing_urls:"):
                in_urls = True
            elif in_urls and s.startswith("- "):
                url = s[2:].strip()
                if url.startswith("http"):
                    cur["landing_urls"].append(url)
            elif s and not s.startswith("#") and not s.endswith(":"):
                in_urls = False
        if cur: offers.append(cur)
    if not offers:
        offers = [
            {"id":"fiverr_wordpress_gigs","categories":["wordpress"],"landing_urls":["https://www.fiverr.com/categories/wordpress"]},
            {"id":"fiverr_shopify_gigs","categories":["shopify"],"landing_urls":["https://www.fiverr.com/categories/shopify"]},
            {"id":"fiverr_webflow_gigs","categories":["webflow"],"landing_urls":["https://www.fiverr.com/categories/webflow"]},
        ]
    offers = [o for o in offers if o.get("categories") and o.get("landing_urls")]
    return offers

def best_match(lead, offers):
    text = f"{lead.get('title','')} {lead.get('text','')}".lower()
    toks = set(re.findall(r"[a-z0-9+_.-]{2,}", text))
    for o in offers:
        cats = [c.lower() for c in (o.get('categories') or [])]
        if any(c in toks for c in cats):
            return {"offer_id": o["id"], "landing_url": o["landing_urls"][0], "reason": "keyword"}
    return None

def to_slack_blocks(cards):
    lines = []
    for c in cards:
        title = c["title"]
        url = c.get("url") or ""
        match = c.get("match") or {}
        offer = match.get("offer_id")
        route = match.get("landing_url") or ""
        tag = f" ↦ {offer}" if offer else ""
        link = f"<{url}|{title}>" if url else title
        lines.append(f"• {link}{tag}")
        if route:
            lines.append(f"    {route}")
    body = "\n".join(lines) if lines else "No leads."
    return {
        "text": "ValueX thin-slice",
        "blocks": [
            {"type":"section","text":{"type":"mrkdwn","text":"*ValueX — Thin-slice leads (offline)*"}},
            {"type":"divider"},
            {"type":"section","text":{"type":"mrkdwn","text": body}}
        ]
    }

def main():
    leads = load_leads()
    offers = load_offers()
    cards = []
    for le in leads:
        match = best_match(le, offers)
        cards.append({
            "title": le["title"],
            "url": le["url"],
            "source": le["source"],
            "match": match or {"offer_id": None, "landing_url": None, "reason": "no-match"},
        })
    out = {
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "count": len(cards),
        "cards": cards,
    }
    CARDS_FILE.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    SLACK_FILE.write_text(json.dumps(to_slack_blocks(cards), ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[thin-slice] Wrote {CARDS_FILE}")
    print(f"[thin-slice] Wrote {SLACK_FILE}")

if __name__ == "__main__":
    main()
