#!/usr/bin/env python3
"""
Test script for semantic matching functionality.
"""
import asyncio
import json
import os
import sys
import pytz
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple

# Add parent directory to path to import our modules
sys.path.append(str(Path(__file__).parent.parent))

try:
    from audit.semantic_matcher import SemanticMatcher
except ImportError as e:
    print(f"Warning: Could not import SemanticMatcher: {e}")
    SemanticMatcher = None

from audit.thin_slice_v2 import (
    tokens_from_text, 
    label_intents, 
    process_lead_jsonl,
    load_offers,
    MIN_RESONANCE_SCORE,
    normalize_text
)

# Test leads with various intents and topics
TEST_LEADS = [
    {
        "id": "test1",
        "text": "I need help setting up SSL on my WordPress site. It's urgent!",
        "created_at": "2025-09-14T12:00:00Z"
    },
    {
        "id": "test2",
        "text": "Looking for recommendations on the best ecommerce platform for small businesses",
        "created_at": "2025-09-14T12:05:00Z"
    },
    {
        "id": "test3",
        "text": "My website is down and I'm losing customers. Need immediate help!",
        "created_at": "2025-09-14T12:10:00Z"
    },
    {
        "id": "test4",
        "text": "How to migrate my WordPress site to a new host with zero downtime?",
        "created_at": "2025-09-14T12:15:00Z"
    }
]

async def test_semantic_matcher() -> bool:
    """Test the semantic matcher with sample text.
    
    Returns:
        bool: True if semantic matcher is available, False otherwise
    """
    print("\n=== Testing Semantic Matcher ===")
    
    if not SemanticMatcher:
        print("Skipping semantic matcher tests - SemanticMatcher not available")
        return False
        
    matcher = SemanticMatcher()
    
    # Check if server is available
    if hasattr(matcher, '_test_connection'):
        await matcher._test_connection()
        if hasattr(matcher, 'server_available') and not matcher.server_available:
            print("Skipping semantic matcher tests - Ollama server not available")
            return False
    
    # Test basic functionality
    test_texts = [
        "I need help with my website",
        "What's the best hosting provider?",
        "My site is down and I'm losing money",
        "How to install WordPress"
    ]
    
    print("\nTesting basic functionality...")
    for text in test_texts:
        try:
            # Test text normalization
            normalized = normalize_text(text)
            print(f"\nOriginal: {text}")
            print(f"Normalized: {normalized}")
            
            # Test tokenization
            tokens = tokens_from_text(normalized)
            print(f"Tokens: {', '.join(list(tokens)[:10])}...")
            
            # Test intent labeling
            labels = label_intents(normalized)
            if labels:
                print(f"Intents: {', '.join(labels)}")
                
        except Exception as e:
            print(f"Error testing basic functionality: {e}")
            return False
    
    # Only test semantic features if server is available
    if hasattr(matcher, 'server_available') and matcher.server_available:
        print("\nTesting semantic features...")
        for text in test_texts:
            try:
                if hasattr(matcher, 'classify_intent'):
                    intent = await matcher.classify_intent(text)
                    print(f"\nText: {text}")
                    print(f"Detected intent: {intent}")
                
                if hasattr(matcher, 'extract_entities'):
                    entities = await matcher.extract_entities(text)
                    if entities and any(entities.values()):
                        print("Entities:")
                        for entity_type, values in entities.items():
                            if values:
                                print(f"  - {entity_type}: {', '.join(values[:3])}" + 
                                    ("..." if len(values) > 3 else ""))
            except Exception as e:
                print(f"Error testing semantic features: {e}")
                return False
    
    return True

async def test_lead_processing(use_semantic: bool = False) -> Tuple[int, int]:
    """Test lead processing with optional semantic matching.
    
    Args:
        use_semantic: Whether to use semantic matching
        
    Returns:
        Tuple of (total_processed, matched_count)
    """
    print(f"\n=== Testing Lead Processing (semantic: {use_semantic}) ===")
    
    # Ensure all test leads are properly formatted as dictionaries
    formatted_leads = []
    for lead in TEST_LEADS:
        if isinstance(lead, str):
            lead = {'text': lead, 'id': f'test_{len(formatted_leads) + 1}'}
        elif not isinstance(lead, dict):
            lead = {'text': str(lead), 'id': f'test_{len(formatted_leads) + 1}'}
            
        # Ensure required fields exist
        lead.setdefault('id', f'test_{len(formatted_leads) + 1}')
        lead.setdefault('source', 'test')
        lead.setdefault('created_at', datetime.now(pytz.utc).isoformat())
        lead.setdefault('text', '')
        formatted_leads.append(lead)
    
    # Write test leads to a temporary file
    test_file = Path("test_leads.jsonl")
    with open(test_file, 'w', encoding='utf-8') as f:
        for lead in formatted_leads:
            f.write(json.dumps(lead) + "\n")
    
    # Load offers
    offers = load_offers()
    if not offers:
        print("Error: No offers loaded")
        return 0, 0
    
    # Initialize semantic matcher if needed
    semantic_matcher = None
    if use_semantic and SemanticMatcher:
        semantic_matcher = SemanticMatcher()
        # Test connection to Ollama server
        if hasattr(semantic_matcher, '_test_connection'):
            await semantic_matcher._test_connection()
            if not getattr(semantic_matcher, 'server_available', False):
                print("Warning: Semantic matcher server not available, falling back to lexical matching")
                use_semantic = False
    
    # Process leads
    output_file = Path(f"test_matches_{'semantic' if use_semantic else 'lexical'}.csv")
    
    try:
        try:
            # Process the leads with appropriate parameters
            results, total, matched = await process_lead_jsonl(
                input_file=test_file,
                output_file=output_file,
                offers=offers,
                hours=24,
                semantic_matcher=semantic_matcher if use_semantic else None
            )
        except Exception as e:
            print(f"Error processing leads: {e}", file=sys.stderr)
            import traceback
            traceback.print_exc()
            return 0, 0
            
        print(f"\nProcessed {total} test leads, found {matched} matches")
        print(f"Results written to {output_file}")
        
        # Print a sample of the results
        if results:
            print("\nSample matches:")
            for i, result in enumerate(results[:3]):  # Show first 3 results
                print(f"{i+1}. Lead ID: {result.get('lead_id')}")
                print(f"   Offer ID: {result.get('offer_id')}")
                print(f"   Score: {result.get('score', 0):.3f}")
                
        return total, matched
        
    except Exception as e:
        print(f"Error processing leads: {e}")
        if 'DEBUG' in os.environ:
            import traceback
            traceback.print_exc()
        return 0, 0
    finally:
        # Clean up
        if test_file.exists():
            test_file.unlink()

async def main():
    """Run all tests."""
    # Test basic functionality first
    print("\n" + "="*50)
    print("TESTING BASIC FUNCTIONALITY")
    print("="*50)
    
    # Run basic tests that don't require semantic matching
    test_text = "Test if basic text processing works"
    try:
        normalized = normalize_text(test_text)
        tokens = tokens_from_text(normalized)
        labels = label_intents(normalized)
        
        print("\nBasic text processing test:")
        print(f"Original: {test_text}")
        print(f"Normalized: {normalized}")
        
        # Handle potential encoding issues with token output
        try:
            tokens_preview = ', '.join(list(tokens)[:10])
            print(f"Tokens: {tokens_preview}...")
        except Exception as e:
            print(f"Tokens: [showing first token only due to encoding] {next(iter(tokens), '')}")
            
        if labels:
            print(f"Intents: {', '.join(labels)}")
        
        print("\n[PASS] Basic text processing works")
    except Exception as e:
        print(f"[ERROR] in basic text processing: {e}")
    
    # Test semantic capabilities if available
    print("\n" + "="*50)
    print("TESTING SEMANTIC CAPABILITIES")
    print("="*50)
    
    semantic_available = False
    if SemanticMatcher:
        try:
            semantic_available = await test_semantic_matcher()
        except Exception as e:
            print(f"[WARNING] Error testing semantic capabilities: {e}")
            semantic_available = False
    else:
        print("[INFO] SemanticMatcher not available, skipping semantic tests")
    
    # Test lexical processing (always available)
    print("\n" + "="*50)
    print("TESTING LEXICAL PROCESSING")
    print("="*50)
    
    total_processed, matched = await test_lead_processing(use_semantic=False)
    if total_processed > 0:
        print(f"\nLexical processing completed: {matched}/{total_processed} matches found")
    
    # Test semantic processing if available
    if semantic_available:
        print("\n" + "="*50)
        print("TESTING SEMANTIC PROCESSING")
        print("="*50)
        
        total_processed, matched = await test_lead_processing(use_semantic=True)
        if total_processed > 0:
            print(f"\nSemantic processing completed: {matched}/{total_processed} matches found")
    
    print("\nAll tests completed!")

if __name__ == "__main__":
    asyncio.run(main())
