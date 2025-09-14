"""
Fetch GitHub issue comments from the last 24-48 hours with deduplication and rate limit handling.
"""
import json
import os
import sys
import hashlib
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, List, Optional, Any, Set, Tuple
import requests
import time

# Configuration
OUTPUT_DIR = Path(__file__).parent.parent / "data" / "live"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_FILE = OUTPUT_DIR / "github.jsonl"

# GitHub API settings
GITHUB_API = "https://api.github.com"
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN")
HEADERS = {
    "Accept": "application/vnd.github.v3+json",
}
if GITHUB_TOKEN:
    HEADERS["Authorization"] = f"token {GITHUB_TOKEN}"
    print("Using GitHub token for higher rate limits")
else:
    print("No GitHub token found - using unauthenticated API with lower rate limits")

# Search query parameters
SEARCH_WINDOW_HOURS = 48  # How far back to search
PER_PAGE = 100  # Max allowed by GitHub API
MAX_RESULTS = 1000  # Safety limit to prevent excessive API usage


def get_remaining_rate_limit() -> Tuple[int, int]:
    """Get remaining rate limit and reset time."""
    url = f"{GITHUB_API}/rate_limit"
    try:
        response = requests.get(url, headers=HEADERS, timeout=10)
        response.raise_for_status()
        data = response.json()
        core = data["resources"]["core"]
        return core["remaining"], core["reset"]
    except Exception as e:
        print(f"Error checking rate limit: {e}")
        return 0, 0


def wait_for_rate_limit_reset():
    """Wait until rate limit resets."""
    _, reset_time = get_remaining_rate_limit()
    if reset_time > 0:
        wait_seconds = max(60, reset_time - int(time.time()))
        print(f"Rate limit reached. Waiting {wait_seconds} seconds...")
        time.sleep(wait_seconds)


def get_github_issues_comments() -> List[Dict[str, Any]]:
    """Fetch recent GitHub issue comments with deduplication and error handling."""
    since = (datetime.now(timezone.utc) - timedelta(hours=SEARCH_WINDOW_HOURS)).isoformat()
    query = f"is:issue-comment created:>={since}"
    url = f"{GITHUB_API}/search/issues"
    
    comments = []
    seen_hashes: Set[str] = set()
    page = 1
    
    while True:
        # Check rate limit before each request
        remaining, _ = get_remaining_rate_limit()
        if remaining < 10:  # Leave some buffer
            wait_for_rate_limit_reset()
        
        params = {
            "q": query,
            "sort": "created",
            "order": "desc",
            "per_page": min(100, PER_PAGE),
            "page": page
        }
        
        try:
            response = requests.get(url, headers=HEADERS, params=params, timeout=30)
            
            # Handle rate limits
            if response.status_code == 403:
                if "rate limit" in response.text.lower():
                    wait_for_rate_limit_reset()
                    continue  # Retry after waiting
                else:
                    print(f"API error: {response.text}")
                    break
                    
            response.raise_for_status()
            data = response.json()
            
            if not data.get("items"):
                break
                
            for item in data["items"]:
                try:
                    # Create content hash for deduplication
                    content_hash = hashlib.sha1(
                        f"{item['id']}:{item['body']}".encode('utf-8')
                    ).hexdigest()
                    
                    if content_hash in seen_hashes:
                        continue
                    
                    seen_hashes.add(content_hash)
                    
                    # Get issue to check if commenter is OP
                    issue_resp = requests.get(
                        item["issue_url"], 
                        headers=HEADERS,
                        timeout=10
                    )
                    issue_resp.raise_for_status()
                    issue = issue_resp.json()
                    
                    comment = {
                        "source": "github",
                        "url": item["html_url"],
                        "author": item["user"]["login"],
                        "created_at_iso": item["created_at"],
                        "text": item["body"],
                        "author_is_op": item["user"]["login"] == issue["user"]["login"],
                        "content_hash": content_hash
                    }
                    
                    comments.append(comment)
                    
                    if len(comments) >= MAX_RESULTS:
                        print(f"Reached max results limit of {MAX_RESULTS}")
                        return comments
                        
                except Exception as e:
                    print(f"Error processing comment {item.get('html_url')}: {e}")
                    continue
                    
            if len(data["items"]) < PER_PAGE:
                break
                
            page += 1
            time.sleep(1)  # Be nice to GitHub's API
            
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            if len(comments) > 0:
                print(f"Returning {len(comments)} comments collected so far")
                return comments
            raise
    
    return comments


def main():
    print(f"Fetching GitHub issue comments from the last {SEARCH_WINDOW_HOURS} hours...")
    
    try:
        comments = get_github_issues_comments()
        
        if not comments:
            print("Error: No comments fetched. Check API rate limits or try again later.")
            sys.exit(1)
            
        # Write to JSONL file
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            for comment in comments:
                f.write(json.dumps(comment) + '\n')
        
        print(f"Wrote {len(comments)} comments to {OUTPUT_FILE}")
        
    except Exception as e:
        print(f"Fatal error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
    all_comments = []
    issues = search_github_issues()
    
    for i, issue in enumerate(issues, 1):
        print(f"Processing issue {i}/{len(issues)}: {issue.get('html_url')}")
        comments = fetch_issue_comments(issue["url"])
        all_comments.extend(comments)
        
        # Be nice to the API
        time.sleep(2)  # Respect secondary rate limits
        
        # Check rate limit every 5 issues
        if i % 5 == 0 and check_rate_limit() < 5:
            print("Rate limit getting low, stopping early")
            break
    
    if not all_comments:
        print("No GitHub comments found in the specified time window")
        exit(1)
        
    write_comments(all_comments)
