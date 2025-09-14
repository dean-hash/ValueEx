"""
Fetch GitHub issue comments from the last 24-48 hours with improved rate limit handling.
"""
import os
import json
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict, Any
import requests

def fetch_github_comments(hours: int = 48, max_pages: int = 2) -> List[Dict[str, Any]]:
    """Fetch GitHub issue comments with improved rate limit handling and window shrinking."""
    base = "https://api.github.com/search/issues"
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "ValueX-Live/1.0"
    }
    
    # Add auth token if available
    if token := os.getenv("GITHUB_TOKEN"):
        headers["Authorization"] = f"Bearer {token}"
    else:
        print("No GitHub token found - using unauthenticated API with lower rate limits")

    issues = []
    chosen_since = None

    # Try with decreasing time windows
    for window in [hours, 24, 12]:
        since_dt = datetime.utcnow() - timedelta(hours=window)
        since = since_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
        params = {
            "q": f"is:issue -is:pr comments:>0 updated:>={since}",
            "sort": "updated",
            "order": "desc",
            "per_page": 30,
            "page": 1
        }
        
        try:
            while params["page"] <= max_pages:
                r = requests.get(base, headers=headers, params=params, timeout=30)
                
                # Handle rate limits
                if r.status_code == 403:
                    print("Rate limited, trying smaller window...")
                    break
                    
                r.raise_for_status()
                data = r.json()
                items = data.get("items", [])
                issues.extend(items)
                
                if len(items) < params["per_page"]:
                    break
                    
                params["page"] += 1
                
        except Exception as e:
            print(f"Search error: {e}")
            
        if issues:
            chosen_since = since
            break
        else:
            print(f"No issues for {window}h window; shrinking...")

    comments = []
    if not issues:
        _write_jsonl("audit/data/live/github.jsonl", comments)
        print("Wrote 0 GitHub comments (rate limit or no results).")
        return comments

    # Fetch comments for each issue
    for issue in issues:
        comments_url = issue.get("comments_url")
        if not comments_url:
            continue
            
        try:
            response = requests.get(comments_url, headers=headers, timeout=30)
            if response.status_code == 403:
                print("Rate limited while fetching comments, continuing...")
                continue
                
            response.raise_for_status()
            
            for comment in response.json():
                created = comment.get("created_at", "")
                if created >= chosen_since:
                    comments.append({
                        "source": "github",
                        "url": comment.get("html_url") or issue.get("html_url", ""),
                        "author": (comment.get("user") or {}).get("login", ""),
                        "created_at_iso": created,
                        "text": comment.get("body") or "",
                        "author_is_op": (comment.get("user") or {}).get("login") == issue.get("user", {}).get("login")
                    })
                    
        except Exception as e:
            print(f"Error fetching comments for {comments_url}: {e}")
            continue

    _write_jsonl("audit/data/live/github.jsonl", comments)
    print(f"Wrote {len(comments)} GitHub comments to audit/data/live/github.jsonl")
    return comments

def _write_jsonl(path: str, rows: List[Dict[str, Any]]) -> None:
    """Helper to write JSONL file with proper directory creation."""
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    with p.open("w", encoding="utf-8") as f:
        for row in rows:
            if row.get("text"):  # Only write if there's actual text
                f.write(json.dumps(row, ensure_ascii=False) + "\n")

def main():
    """Main entry point for command-line execution."""
    try:
        fetch_github_comments()
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    import sys
    main()
