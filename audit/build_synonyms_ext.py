#!/usr/bin/env python3
"""
Builds an extended synonyms map from sources_terms.csv with weights and sources.
Outputs to audit/synonyms_ext.json for use in thin_slice_v2.py.
"""
import csv
import json
from collections import defaultdict
from pathlib import Path

HERE = Path(__file__).parent.resolve()
SOURCES_CSV = HERE / "sources_terms.csv"
OUT_JSON = HERE / "synonyms_ext.json"

def main():
    """Build and save the extended synonyms map."""
    # term -> {sources: [str], weight: int}
    term_map = defaultdict(lambda: {"sources": [], "weight": 0})
    
    with open(SOURCES_CSV, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            term = row["term"].strip().lower()
            source = row["source"].strip().lower()
            weight = int(row["weight"])
            
            term_map[term]["sources"].append(source)
            term_map[term][weight] = max(term_map[term].get("weight", 0), weight)
    
    # Add simple synonyms (wp -> wordpress, shop -> shopify)
    simple_synonyms = {
        "wp": "wordpress",
        "woo": "woocommerce",
        "shop": "shopify",
        "ecom": "ecommerce",
        "logo design": "logo",
    }
    
    for syn, target in simple_synonyms.items():
        if target in term_map:
            term_map[syn] = {
                "sources": [f"synonym:{target}"],
                "weight": term_map[target]["weight"] - 1,  # Slightly lower weight
                "target": target
            }
    
    # Convert to final format
    result = {}
    for term, data in term_map.items():
        result[term] = {
            "sources": sorted(list(set(data["sources"]))),
            "weight": data["weight"]
        }
    
    # Save to JSON
    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    
    print(f"[build_synonyms] Wrote {len(result)} terms to {OUT_JSON}")

if __name__ == "__main__":
    main()
