#!/usr/bin/env python3
import json
import os
import sys
from pathlib import Path
from datetime import datetime, timezone, timedelta

# Add parent directory to path to import thin_slice_v2
sys.path.append(str(Path(__file__).parent.parent))

# Set debug environment variable
os.environ['DEBUG'] = 'true'

# Import after setting environment variables
from thin_slice_v2 import process_lead_jsonl, load_offers

# Enable debug output
DEBUG = True

def print_debug(msg):
    if DEBUG:
        print(f"[DEBUG] {msg}")

def main():
    print("Starting test_single_lead.py with DEBUG=True")
    
    # Paths
    script_dir = Path(__file__).parent
    data_dir = script_dir.parent / 'data'
    output_dir = script_dir.parent / 'output'
    
    # Ensure output directory exists
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Load offers
    print("Loading offers...")
    offers = load_offers()
    print(f"Loaded {len(offers)} offers")
    
    # Print offer categories for debugging
    if DEBUG:
        print("\nOffer Categories:")
        for offer_id, offer in offers.items():
            print(f"- {offer_id}: {offer.get('categories', [])}")
    
    # Create a test lead that should match with offers
    test_lead = {
        "source": "test",
        "url": "https://example.com/test",
        "title": "I need help with my WordPress website and SSL setup",
        "text": "I'm looking for someone to help me set up SSL on my WordPress site. I need it to be secure and fast. Also looking for a good hosting provider.",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Create a temporary JSONL file with the test lead
    temp_file = output_dir / 'test_lead.jsonl'
    with open(temp_file, 'w', encoding='utf-8') as f:
        json_str = json.dumps(test_lead)
        print(f"\nTest lead JSON: {json_str}")
        f.write(json_str + '\n')
    
    # Output file
    output_file = output_dir / 'test_output.csv'
    print(f"\nOutput will be written to: {output_file}")
    
    # Process the lead
    print("\nProcessing test lead...")
    try:
        print("Calling process_lead_jsonl...")
        results, total, matched = process_lead_jsonl(temp_file, output_file, offers, hours=24)
        
        print(f"\nProcessing complete.")
        print(f"Total leads processed: {total}")
        print(f"Total matches found: {matched}")
        
        if matched > 0:
            print("\nMatching offers (from CSV):")
            with open(output_file, 'r', encoding='utf-8') as f:
                # Skip header
                next(f)
                for line in f:
                    print(line.strip())
        else:
            print("\nNo matches found. Check debug output above for details.")
            
            # If no matches, print the generated tokens and labels for debugging
            print("\nDebugging tokenization and labeling:")
            from thin_slice_v2 import tokens_from_text, label_intents
            tokens = tokens_from_text(test_lead['text'])
            labels = label_intents(test_lead['text'])
            print(f"Tokens: {sorted(tokens)}")
            print(f"Labels: {labels}")
            
    except Exception as e:
        print(f"\nERROR: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        
        # Print local variables for debugging
        print("\nLocal variables at time of error:")
        for name, value in locals().items():
            print(f"{name}: {value}")

if __name__ == "__main__":
    main()
