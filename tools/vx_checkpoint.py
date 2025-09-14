"""
Checkpoint utility for ValueX pipeline state management.
"""
from __future__ import annotations

import argparse
import json
import os
import time
from datetime import datetime, timezone
from pathlib import Path

def create_checkpoint(label: str, next_steps: str = ""):
    """Create a timestamped checkpoint with optional next steps."""
    # Get git info if available
    try:
        head = os.popen("git rev-parse --short HEAD").read().strip()
        branch = os.popen("git rev-parse --abbrev-ref HEAD").read().strip()
    except Exception:
        head = "unknown"
        branch = "unknown"
    
    # Create checkpoint data
    timestamp = datetime.now(timezone.utc).isoformat()
    checkpoint = {
        "timestamp": timestamp,
        "label": label,
        "git": {
            "head": head,
            "branch": branch
        },
        "next_steps": next_steps
    }
    
    # Ensure checkpoints directory exists
    checkpoints_dir = Path("audit") / "checkpoints"
    checkpoints_dir.mkdir(exist_ok=True)
    
    # Write checkpoint
    checkpoint_file = checkpoints_dir / f"checkpoint_{int(time.time())}.json"
    with open(checkpoint_file, 'w') as f:
        json.dump(checkpoint, f, indent=2)
    
    # Update latest checkpoint reference (using a file with the path instead of symlink for Windows compatibility)
    latest = checkpoints_dir / "latest.json"
    with open(latest, 'w') as f:
        f.write(str(checkpoint_file.name))
    
    print(f"[OK] Checkpoint created: {label}")
    print(f"   [*] Next: {next_steps}")
    print(f"   [>] {checkpoint_file}")

def main():
    parser = argparse.ArgumentParser(description="Manage ValueX pipeline checkpoints")
    parser.add_argument("--checkpoint", action="store_true", help="Create a new checkpoint")
    parser.add_argument("--label", type=str, default="checkpoint", help="Label for the checkpoint")
    parser.add_argument("--next", type=str, default="", help="Next steps after this checkpoint")
    
    args = parser.parse_args()
    
    if args.checkpoint:
        create_checkpoint(args.label, args.next)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
