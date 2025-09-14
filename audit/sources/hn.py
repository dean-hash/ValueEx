"""
Fetches recent Hacker News comments using Algolia's public API.
Outputs to data/live/hn.jsonl with one JSON object per line.
"""
import json
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
import requests

# Configuration
OUTPUT_DIR = Path(__file__).parent.parent / "data" / "live"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_FILE = OUTPUT_DIR / "hn.jsonl"

# Time window: last 24-48 hours
END_TIME = datetime.now(timezone.utc)
START_TIME = END_TIME - timedelta(hours=48)

# Algolia HN Search API endpoint
ALGOLIA_API = "https://hn.algolia.com/api/v1/search_by_date"

def fetch_hn_comments():
    """Fetch HN comments from the last 48 hours."""
    params = {
        "tags": "comment",
        "numericFilters": f"created_at_i>{int(START_TIME.timestamp())},created_at_i<{int(END_TIME.timestamp())}",
        "hitsPerPage": 200,  # Max allowed by API
        "page": 0
    }
    
    try:
        print(f"Fetching HN comments from {START_TIME.isoformat()} to {END_TIME.isoformat()}")
        response = requests.get(ALGOLIA_API, params=params, timeout=30)
        response.raise_for_status()
        data = response.json()
        
        comments = []
        for hit in data.get("hits", []):
            created_at = datetime.fromtimestamp(hit.get("created_at_i"), timezone.utc)
            comment = {
                "source": "hn",
                "url": f"https://news.ycombinator.com/item?id={hit['story_id']}#{hit['objectID']}",
                "author": hit.get("author"),
                "created_at_iso": created_at.isoformat(),
                "text": hit.get("comment_text", ""),
                "story_title": hit.get("story_title"),
                "story_url": hit.get("story_url")
            }
            comments.append(comment)
        
        print(f"Fetched {len(comments)} HN comments")
        return comments
        
    except requests.RequestException as e:
        print(f"Error fetching HN comments: {e}")
        return []

def write_comments(comments):
    """Write comments to output file in JSONL format."""
    if not comments:
        print("No comments to write")
        return
        
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        for comment in comments:
            f.write(json.dumps(comment) + '\n')
    print(f"Wrote {len(comments)} comments to {OUTPUT_FILE}")

if __name__ == "__main__":
    comments = fetch_hn_comments()
    if not comments:
        print("No HN comments found in the specified time window")
        exit(1)
    write_comments(comments)
