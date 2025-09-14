#!/usr/bin/env python3
# ValueX thin-slice v2 - Live Data Pipeline
import asyncio
import json
import re
import sys
import os
import argparse
import hashlib
import math
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any, TextIO, Set, Union
import unicodedata
from datetime import datetime, timezone, timedelta
import csv
from dataclasses import dataclass, asdict, field

# Import our semantic matcher
try:
    from semantic_matcher import SemanticMatcher, SemanticMatch
except ImportError:
    # Fallback if semantic_matcher is not available
    class SemanticMatcher:
        def __init__(self, *args, **kwargs):
            pass
        async def classify_intent(self, text: str) -> str:
            return "general_inquiry"
        async def semantic_match(self, *args, **kwargs):
            return []
        async def extract_entities(self, text: str) -> dict:
            return {"technologies": [], "problems": [], "actions": [], "time_references": []}

    class SemanticMatch:
        def __init__(self, text: str, score: float, matched_terms: List[str], intent: str = ""):
            self.text = text
            self.score = score
            self.matched_terms = matched_terms
            self.intent = intent

# Debug flag - can be overridden by environment variable
DEBUG = os.environ.get('DEBUG', '').lower() in ('true', '1', 't')

# --- Constants ---
# Standardized to 0-1 scale (0.0 to 1.0)
MIN_RESONANCE_SCORE = 0.3  # Lowered threshold for testing (0.0 to 1.0)
URGENCY_WORDS = {"urgent", "asap", "deadline", "blocked", "stuck", "help", "please"}

# Intent detection patterns
ASK_RE = re.compile(r"\b(how do i|how to|can someone|any advice|recommend|where can i|looking for)\b", re.I)
BUY_RE = re.compile(r"\b(budget|quote|pricing|hire|contract|rfp|paid)\b", re.I)
PAIN_RE = re.compile(r"\b(error|crash|failing|broken|stuck|blocked|can[’']?t|doesn[’']?t work)\b", re.I)
CMP_RE = re.compile(r"\b(vs\.?|versus|better than|switch(ing)? from)\b", re.I)

# ---- Configuration ----
WS = Path(__file__).parent.parent  # Workspace root
OUT = WS / "audit"
OUT.mkdir(exist_ok=True, parents=True)

# ---- Text Processing Helpers ----
def _now_utc() -> datetime:
    """Get current UTC time."""
    return datetime.now(timezone.utc)

def normalize_text_from_lead(lead) -> str:
    """Pick best available text field from heterogeneous sources.
    
    Args:
        lead: Can be a dictionary with text fields or a string
        
    Returns:
        str: The normalized text content
    """
    # If lead is already a string, return it directly
    if isinstance(lead, str):
        return lead.strip()
        
    # If lead is a dictionary, try to extract text from common fields
    if isinstance(lead, dict):
        for k in ("text", "body", "comment_text", "title", "content"):
            v = lead.get(k)
            if isinstance(v, str) and v.strip():
                return v.strip()
    
    # If we get here, return empty string
    return ""

def tokens_from_text(text: str) -> set[str]:
    """Extract and normalize tokens from text with enhanced word variations.
    
    Args:
        text: Input text to tokenize
        
    Returns:
        Set of normalized tokens including variations and bigrams
    """
    if not text:
        return set()
    
    # Common word variations and synonyms
    VARIATIONS = {
        'wordpress': ['wordpress', 'word press', 'wp'],
        'ecommerce': ['ecommerce', 'e-commerce', 'e commerce'],
        'website': ['website', 'site', 'web site'],
        'ssl': ['ssl', 'https', 'security certificate'],
        'hosting': ['hosting', 'web hosting', 'server'],
        'design': ['design', 'redesign', 'theme', 'template'],
        'plugin': ['plugin', 'extension', 'addon', 'module'],
        'app': ['app', 'application', 'mobile app']
    }
    
    # Convert to lowercase and normalize unicode
    text = unicodedata.normalize('NFKD', str(text).lower())
    
    # Replace punctuation with spaces, keep hyphens
    text = re.sub(r'[^\w\s-]', ' ', text)
    
    # Split into words and remove empty strings
    words = [w.strip('-') for w in text.split() if w.strip()]
    
    # Generate variations and synonyms
    variations = set()
    for word in words:
        # Add the original word if it's meaningful
        if len(word) > 1 or word in {'a', 'i'}:
            variations.add(word)
        
        # Add known variations and synonyms
        for base, syns in VARIATIONS.items():
            if any(s in word for s in syns):
                variations.update(syns)
    
    # Add common word forms (plurals, verb forms, etc.)
    word_forms = set()
    for word in variations.copy():
        if len(word) > 3:  # Only for meaningful words
            if word.endswith('ing'):
                word_forms.add(word[:-3])  # running -> run
            if word.endswith('ed'):
                word_forms.add(word[:-2])  # created -> create
            if word.endswith('es'):
                word_forms.add(word[:-2])  # fixes -> fix
            if word.endswith('s') and not word.endswith('ss'):
                word_forms.add(word[:-1])  # plugins -> plugin
    
    variations.update(word_forms)
    
    # Add bigrams for better phrase matching
    bigrams = set()
    for i in range(len(words) - 1):
        bigram = f"{words[i]} {words[i+1]}"
        bigrams.add(bigram)
        
        # Add variations of bigrams too
        if any(w in VARIATIONS for w in bigram.split()):
            for base, syns in VARIATIONS.items():
                if base in bigram:
                    for syn in syns:
                        if syn != base:
                            bigrams.add(bigram.replace(base, syn))
    
    # Combine all tokens
    all_tokens = variations.union(bigrams)
    
    # Filter out very short tokens (except common words)
    common_short_words = {'it', 'in', 'on', 'at', 'to', 'be', 'as', 'by', 'or', 'an', 'a', 'i', 'up', 'my', 'me', 'we'}
    tokens = {t for t in all_tokens if len(t) > 2 or t in common_short_words}
    
    if DEBUG:
        print(f"  Generated tokens: {sorted(tokens)}")
    
    return tokens

def label_intents(text: str) -> list[str]:
    """Label intents from text using regex patterns."""
    lbl = []
    if ASK_RE.search(text):  lbl.append("explicit_ask")
    if BUY_RE.search(text):  lbl.append("buy_signal")
    if PAIN_RE.search(text): lbl.append("pain")
    if CMP_RE.search(text):  lbl.append("comparison")
    return lbl

def label_weight(labels: list[str]) -> float:
    """Calculate weight based on intent labels."""
    w = 0.0
    if "buy_signal"   in labels: w += 0.50
    if "explicit_ask" in labels: w += 0.35
    if "pain"         in labels: w += 0.25
    if "comparison"   in labels: w += 0.15
    return w

def recency_norm(ts_iso: str) -> float:
    """
    Calculate recency score (1.0 = now, 0.0 = old).
    
    Args:
        ts_iso: ISO 8601 timestamp string
        
    Returns:
        Float between 0.0 and 1.0 where 1.0 is most recent
    """
    try:
        # Handle timezone-aware and naive timestamps
        if not ts_iso:
            return 0.5  # Default score for missing timestamp
            
        # Parse timestamp
        if ts_iso.endswith('Z'):
            ts = datetime.fromisoformat(ts_iso.replace('Z', '+00:00'))
        else:
            ts = datetime.fromisoformat(ts_iso)
            
        # Ensure timezone-aware
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
            
        # Calculate days since now
        now = _now_utc()
        days = max(0.0, (now - ts).total_seconds() / 86400.0)
        
        # Decay over ~7 days
        return max(0.0, 1.0 - min(days/7.0, 1.0))
        
    except (ValueError, TypeError) as e:
        print(f"Warning: Invalid timestamp '{ts_iso}': {e}", file=sys.stderr)
        return 0.5  # Fallback score

def offer_match_score(text_tokens: set[str], offer: dict) -> float:
    """
    Score how well text matches offer categories with improved matching.
    
    Args:
        text_tokens: Set of normalized tokens from the lead text
        offer: Offer dictionary with 'categories' list
        
    Returns:
        Float score (higher is better match)
    """
    DEBUG = True
    
    if not text_tokens or not offer:
        if DEBUG:
            print("  No text tokens or offer to match")
        return 0.0
    
    if DEBUG:
        print("\n" + "="*80)
        print(f"  MATCHING LEAD TO OFFER: {offer.get('id', 'unknown')}")
        print("  " + "-"*76)
        print(f"  OFFER CATEGORIES: {offer.get('categories', [])}")
        print(f"  TEXT TOKENS ({len(text_tokens)}): {', '.join(sorted(list(text_tokens))[:30])}" + 
              ("..." if len(text_tokens) > 30 else ""))
        print("  " + "-"*76)
    
    score = 0.0
    matched_terms = []
    
    # Check each category term with different matching strategies
    for cat in offer.get("categories", []):
        # Convert category to lowercase and split into terms
        cat_terms = str(cat).lower().split()
        
        # 1. Exact match for each term
        for term in cat_terms:
            if term in text_tokens:
                score += 1.0
                matched_terms.append(f"[EXACT] {term}")
                if DEBUG:
                    print(f"    +1.0 for exact match: '{term}'")
            
            # 2. Partial matches (substring)
            else:
                matched = False
                for token in text_tokens:
                    if term in token or token in term:
                        # Only count partial matches if they're not too short
                        if len(term) > 2 and len(token) > 2:
                            score += 0.5
                            matched_terms.append(f"[PARTIAL] {term}~{token}")
                            if DEBUG:
                                print(f"    +0.5 for partial match: '{term}' in '{token}'")
                            matched = True
                            break  # Only count one partial match per term
                
                # 3. Check for plural forms and other variations
                if not matched and len(term) > 3:
                    # Try plural/singular variations
                    variations = []
                    if term.endswith('s'):
                        variations.append(term[:-1])  # Remove 's' for singular
                    else:
                        variations.append(term + 's')  # Add 's' for plural
                    
                    # Check variations
                    for variant in variations:
                        if variant in text_tokens:
                            score += 0.7
                            matched_terms.append(f"[VARIANT] {term} -> {variant}")
                            if DEBUG:
                                print(f"    +0.7 for variant match: '{term}' -> '{variant}'")
                            break
    
    # Check for urgency words
    urgency_matches = [w for w in URGENCY if w in text_tokens]
    if urgency_matches:
        score += 0.5
        matched_terms.append(f"[URGENCY] {', '.join(urgency_matches)}")
        if DEBUG:
            print(f"    +0.5 for urgency words: {urgency_matches}")
    
    # Calculate base score before normalization
    base_score = score
    
    # Normalize score by number of category terms (prevent long categories from dominating)
    all_category_terms = sum(len(str(cat).lower().split()) for cat in offer.get("categories", []))
    if all_category_terms > 0:
        score = min(score, all_category_terms)  # Cap at 1 point per term
        normalized_score = score / all_category_terms  # Normalize to 0-1 range
    else:
        normalized_score = 0.0
    
    if DEBUG:
        print("\n  " + "="*40 + " SCORE SUMMARY " + "="*40)
        print(f"  OFFER: {offer.get('id', 'unknown')}")
        print("  " + "-"*96)
        print(f"  CATEGORIES: {offer.get('categories', [])}")
        print(f"  MATCHED TERMS ({len(matched_terms)}):")
        for i, term in enumerate(matched_terms[:10], 1):
            print(f"    {i}. {term}")
        if len(matched_terms) > 10:
            print(f"    ... and {len(matched_terms) - 10} more matches")
        print("  " + "-"*96)
        print(f"  BASE SCORE: {base_score:.2f}")
        print(f"  CATEGORY TERMS: {all_category_terms}")
        print(f"  NORMALIZED SCORE: {normalized_score:.3f}")
        print("  " + "="*96 + "\n")
    
    return normalized_score
    
    return score

def resonance_score(lead: dict, offer: dict, labels: list[str], tokens: set[str]) -> float:
    """
    Calculate resonance score between lead and offer with detailed debug output.
    
    Returns a score between 0.0 and 1.0 where higher is a better match.
    """
    DEBUG = True
    
    # 1. Calculate recency score (40% weight)
    created_at = lead.get("created_at", "")
    recency = recency_norm(created_at)
    
    # 2. Calculate intent score based on labels (30% weight)
    intent = label_weight(labels)
    
    # 3. Calculate offer match score (30% weight)
    match = offer_match_score(tokens, offer)
    
    # 4. Additional boost for title matches
    title_boost = 0.0
    title = lead.get("title", "").lower()
    if title:
        title_tokens = set(re.findall(r'\w+', title))
        for cat in offer.get("categories", []):
            for term in str(cat).lower().split():
                if term in title_tokens:
                    title_boost += 0.2  # Boost for title matches
                    break
    
    # 5. Calculate final weighted score with boost
    score = round(0.35 * recency + 0.3 * intent + 0.3 * match + 0.05 * min(title_boost, 1.0), 3)
    
    # 6. Ensure score is within bounds
    score = max(0.0, min(1.0, score))
    
    if DEBUG:
        print("\n" + "="*80)
        print(f"SCORING LEAD: {lead.get('title', 'No title')}")
        print(f"AGAINST OFFER: {offer.get('id', 'unknown')}")
        print("="*80)
        print(f"RECENCY SCORE (35%): {recency:.3f} (created at: {created_at})")
        print(f"INTENT SCORE (30%): {intent:.3f} (labels: {labels})")
        print(f"MATCH SCORE (30%): {match:.3f}")
        print(f"TITLE BOOST (5%): {min(title_boost, 1.0):.3f}")
        print("-"*40)
        print(f"FINAL SCORE: {score:.3f} (threshold: {MIN_RESONANCE_SCORE:.3f})")
        if score >= MIN_RESONANCE_SCORE:
            print("✅ MATCH FOUND!")
        else:
            print("❌ Below threshold")
        print("="*80 + "\n")
    
    return score

# Output files
CARDS = OUT / "thin_slice_cards.json"
SLACK = OUT / "thin_slice_slack.json"
PREV = OUT / "thin_slice_preview.md"
ACTIONS = OUT / "next_actions.csv"
CONFIG = OUT / "config.json"

# Live data paths
LIVE_DIR = WS / "audit" / "data" / "live"
LIVE_DIR.mkdir(parents=True, exist_ok=True)
COMMENTS_FILE = LIVE_DIR / "comments.jsonl"
PREVIEWS_FILE = LIVE_DIR / "previews.csv"
METRICS_FILE = LIVE_DIR / "metrics.json"

# Constants (keeping this for backward compatibility, but using the 0-1 scale from the top of the file)

@dataclass
class Metrics:
    """Track pipeline metrics."""
    window_hours: int = 24
    hn_fetched: int = 0
    gh_fetched: int = 0
    merged: int = 0
    queued_resonance60: int = 0
    generated_at: str = field(default_factory=lambda: datetime.utcnow().isoformat() + 'Z')
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
    
    def save(self):
        """Save metrics to file."""
        with open(METRICS_FILE, 'w', encoding='utf-8') as f:
            json.dump(self.to_dict(), f, indent=2)

# --- Load Config ---
def load_config() -> Dict[str, Any]:
    """Load configuration from file."""
    if not CONFIG.exists():
        return {}
    with open(CONFIG, 'r', encoding='utf-8') as f:
        return json.load(f)
    """Load config file, handling UTF-8 BOM if present."""
    try:
        # First try with utf-8-sig to handle BOM if present
        try:
            with open(CONFIG, 'r', encoding='utf-8-sig') as f:
                return json.load(f)
        except UnicodeDecodeError:
            # Fall back to regular utf-8 if sig fails
            with open(CONFIG, 'r', encoding='utf-8') as f:
                return json.load(f)
    except Exception as e:
        print(f"Error loading config: {e}")
        sys.exit(1)

# Load config into global
CFG = load_config()

# ---- Lead loading (offline) ----
def _norm_title_text(d):
    text = d.get("text") or ""
    title = d.get("title") or ""
    if not title and text:
        title = text.split("\n")[0][:180]
    return title or "(no title)", text

def load_leads(max_items=10):
    # For testing, use fallback data directly
    leads = [
        {"title":"Hiring WordPress dev for plugin cleanup","url":"","source":"sample","text":"need wordpress plugin fix urgent"},
        {"title":"Shopify theme tweaks needed","url":"","source":"sample","text":"looking for shopify expert to fix theme"},
        {"title":"Logo and brand kit help","url":"","source":"sample","text":"brand identity and logomaker options"},
        {"title":"Webflow site refresh","url":"","source":"sample","text":"webflow redesign landing pages"},
    ]
    return leads[:max_items]

# ---- Offers (JSON loader) ----
def load_offers():
    """Load offers from JSON config."""
    try:
        # First try to load from the valuex-firehose config
        firehose_offers = Path("../valuex-firehose/config/offers.json")
        if firehose_offers.exists():
            with open(firehose_offers, 'r', encoding='utf-8') as f:
                offers_list = json.load(f)
        else:
            # Fall back to local file
            local_offers = Path("offers.json")
            if local_offers.exists():
                with open(local_offers, 'r', encoding='utf-8') as f:
                    offers_list = json.load(f)
            else:
                print("No offers file found. Using default offers.", file=sys.stderr)
                # Default offers if no file is found
                offers_list = [
                    {
                        "id": "fiverr_wordpress_gigs",
                        "categories": ["wordpress", "woocommerce", "plugin", "theme", "wp site", "fix", "freelancer", "hire"],
                        "landing_urls": ["https://www.fiverr.com/categories/programming-tech/wordpress-services"]
                    },
                    {
                        "id": "fiverr_shopify_gigs",
                        "categories": ["shopify", "ecommerce", "store", "product page", "checkout", "theme", "app"],
                        "landing_urls": ["https://www.fiverr.com/categories/programming-tech/shopify-services"]
                    },
                    {
                        "id": "fiverr_logo_design",
                        "categories": ["logo", "branding", "brand", "identity", "graphic", "designer"],
                        "landing_urls": ["https://www.fiverr.com/categories/graphics-design/logo-design"]
                    },
                    {
                        "id": "fiverr_webflow",
                        "categories": ["webflow", "landing page", "website design", "cms", "no-code", "design"],
                        "landing_urls": ["https://www.fiverr.com/categories/programming-tech/webflow-services"]
                    }
                ]
        
        # Convert list to dict with ID as key and ensure categories is always a list
        offers_dict = {}
        for offer in offers_list:
            if isinstance(offer, dict) and 'id' in offer:
                # Ensure categories is a list and all categories are lowercase
                if 'categories' not in offer or not isinstance(offer['categories'], list):
                    offer['categories'] = []
                else:
                    offer['categories'] = [str(cat).lower() for cat in offer['categories']]
                offers_dict[offer['id']] = offer
        
        print(f"Loaded {len(offers_dict)} offers")
        return offers_dict
        
    except json.JSONDecodeError as e:
        print(f"Error parsing offers JSON: {e}", file=sys.stderr)
    except Exception as e:
        print(f"Error loading offers: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
    
    return {}

def label_intents(text: str) -> List[str]:
    """
    Label intents from text using regex patterns.
    
    Returns:
        List of intent labels (e.g., ['explicit_ask', 'buying_signal'])
    """
    if not text or not isinstance(text, str):
        return []
        
    text = text.lower()
    labels = []
    
    # Look for explicit asks (more comprehensive patterns)
    ask_phrases = [
        r'\b(looking\s+for|need|want|seeking|searching\s+for|find\s+(me|someone)|help\s+with|recommend|suggest|anyone\s+(know|recommend))',
        r'\b(can\s+someone|where\s+can\s+i|who\s+can|how\s+to\s+find|best\s+way\s+to\s+find)',
        r'\b(need\s+help|looking\s+to\s+hire|want\s+to\s+hire|looking\s+to\s+work\s+with)',
        r'\b(any\s+(recommendations|suggestions)|suggestions\s+for|recommendations\s+for)'
    ]
    
    if any(re.search(pattern, text) for pattern in ask_phrases):
        labels.append('explicit_ask')
    
    # 2. Buying signals (indicate willingness to purchase)
    buying_signal_patterns = [
        r'(?:budget of|willing to pay|my budget is|i can pay|i can spend|i have \$|\$\d+)',
        r'(?:looking to buy|want to buy|need to buy|ready to buy|interested in buying|want to purchase|need to purchase)',
        r'(?:hiring a|hiring an|looking to hire|want to hire|need to hire|i need a|i need an)',
        r'(?:best place to buy|where to buy|where can i buy|where should i buy|best way to buy)',
        r'(?:recommend a|suggest a|which one should i buy|which one to choose|which one is better)'
    ]
    
    if any(re.search(p, text) for p in buying_signal_patterns):
        labels.append('buying_signal')
    
    # 3. Pain points (expressing frustration or problems)
    pain_point_patterns = [
        r'(?:problem with|issue with|trouble with|having trouble|having issues|having problems|not working|doesn\'t work|broken|error)',
        r'(?:frustrated|annoyed|disappointed|upset|angry|mad|hate|terrible|awful|worst)',
        r'(?:can\'t figure out|don\'t know how|don\'t understand|confused about|struggling with|having a hard time|need help with)',
        r'(?:waste of|not worth it|not good|not great|not happy|not satisfied|not impressed|disappointed with)',
        r'(?:why is|why does|why won\'t|why can\'t|how come|how do i fix|how to fix|how to solve)'
    ]
    
    if any(re.search(p, text) for p in pain_point_patterns):
        labels.append('pain_point')
    
    return labels

def normalize_text(lead) -> str:
    """Extract and normalize text from lead (dict or str)."""
    # If input is already a string, just normalize it
    if isinstance(lead, str):
        text = lead
    else:
        # Try common fields across HN/GitHub/Reddit/etc.
        text = ""
        for k in ("text", "body", "comment_text", "title", "content"):
            v = lead.get(k) if isinstance(lead, dict) else None
            if isinstance(v, str) and v.strip():
                text = v
                break
    
    # Basic normalization
    if text:
        text = unicodedata.normalize('NFKD', text)
        text = re.sub(r'[^\w\s-]', ' ', text)  # Replace non-word chars with space
        text = re.sub(r'\s+', ' ', text).strip().lower()
    
    return text or ""

def label_intents(text: str) -> list[str]:
    """
    Label text with intent categories using regex patterns.
    
    Args:
        text: Input text to analyze
        
    Returns:
        List of detected intent labels
    """
    DEBUG = True
    
    if not text or not isinstance(text, str):
        return []
    
    text = text.lower()
    labels = []
    
    # Debug output
    if DEBUG:
        print("\n  Analyzing text for intents:")
        print(f"  - Text: {text[:200]}...")
    
    # Check for explicit asks
    ask_matches = list(ASK_RE.finditer(text))
    if ask_matches:
        labels.append("explicit_ask")
        if DEBUG:
            print(f"  - Found explicit ask: {ask_matches[0].group(0)}")
    
    # Check for buying signals
    buy_matches = list(BUY_RE.finditer(text))
    if buy_matches:
        labels.append("buy_signal")
        if DEBUG:
            print(f"  - Found buying signal: {buy_matches[0].group(0)}")
    
    # Check for pain points
    pain_matches = list(PAIN_RE.finditer(text))
    if pain_matches:
        labels.append("pain")
        if DEBUG:
            print(f"  - Found pain point: {pain_matches[0].group(0)}")
    
    # Check for comparisons
    cmp_matches = list(CMP_RE.finditer(text))
    if cmp_matches:
        labels.append("comparison")
        if DEBUG:
            print(f"  - Found comparison: {cmp_matches[0].group(0)}")
    
    if DEBUG and not labels:
        print("  - No specific intents detected")
    
    return labels

def label_weight(labels: list[str]) -> float:
    """Calculate weight based on intent labels."""
    w = 0.0
    if "buy_signal" in labels:
        w += 0.5
    return w

def _get_recency_score(lead) -> float:
    """
    Calculate recency score for a lead (1.0 = now, 0.0 = old).
    
    Args:
        lead: Either a lead dictionary containing timestamp information or a timestamp string
        
    Returns:
        Float between 0.0 and 1.0 where 1.0 is most recent
    """
    if isinstance(lead, str):
        ts_iso = lead
    else:
        ts_iso = lead.get('created_at') or lead.get('timestamp') or lead.get('date') if isinstance(lead, dict) else None
    if not ts_iso:
        return 0.0
        
    try:
        # Parse the timestamp
        dt = datetime.fromisoformat(ts_iso.replace('Z', '+00:00'))
        now = datetime.now(dt.tzinfo)  # Preserve timezone
        
        # Calculate hours since the timestamp
        delta = now - dt
        hours = delta.total_seconds() / 3600
        
        # Convert to a score between 0 and 1, with 1 being most recent
        # Using exponential decay: e^(-λt) where λ is the decay rate
        # Here we set half-life to 24 hours (score = 0.5 at 24 hours)
        half_life = 24.0
        lambda_decay = math.log(2) / half_life
        score = math.exp(-lambda_decay * hours)
        
        # Ensure score is between 0 and 1
        return max(0.0, min(1.0, score))
        
    except (ValueError, TypeError) as e:
        if DEBUG:
            print(f"Error calculating recency for {ts_iso}: {e}")
        return 0.0

def recency_norm(ts_iso: str) -> float:
    """
    Calculate recency score (1.0 = now, 0.0 = old).
    
    Args:
        ts_iso: ISO 8601 timestamp string
        
    Returns:
        Float between 0.0 and 1.0 where 1.0 is most recent
    """
    if not ts_iso:
        return 0.0
        
    try:
        # Parse the timestamp
        dt = datetime.fromisoformat(ts_iso.replace('Z', '+00:00'))
        now = datetime.now(dt.tzinfo)  # Preserve timezone
        
        # Calculate hours since the timestamp
        delta = now - dt
        hours = delta.total_seconds() / 3600
        
        # Convert to a score between 0 and 1, with 1 being most recent
        # Using exponential decay: e^(-λt) where λ is the decay rate
        # Here we set half-life to 24 hours (score = 0.5 at 24 hours)
        half_life = 24.0
        lambda_decay = math.log(2) / half_life
        score = math.exp(-lambda_decay * hours)
        
        # Ensure score is between 0 and 1
        return max(0.0, min(1.0, score))
        
    except (ValueError, TypeError) as e:
        if DEBUG:
            print(f"Error calculating recency for {ts_iso}: {e}")
        return 0.0

async def offer_match_score(
    text: str,
    text_tokens: set[str],
    offer: dict,
    semantic_matcher: Optional[SemanticMatcher] = None
) -> Tuple[float, List[Dict]]:
    """
    Score how well text matches offer categories using both lexical and semantic matching.
    
    Args:
        text: Original text for semantic analysis
        text_tokens: Set of normalized text tokens for lexical matching
        offer: Offer dictionary with 'categories' list
        semantic_matcher: Optional SemanticMatcher instance for semantic analysis
        
    Returns:
        Tuple of (score, match_details) where score is between 0.0 and 1.0
    """
    if not text_tokens or not offer.get('categories'):
        return 0.0, []
    
    # Initialize semantic matcher if not provided
    if semantic_matcher is None:
        semantic_matcher = SemanticMatcher()
    
    # Get all category terms with weights
    category_terms = []
    category_weights = []
    for cat in offer.get('categories', []):
        terms = cat.lower().split()
        if terms:
            category_terms.extend(terms)
            category_weights.append(1.0)  # Primary term
            for term in terms[1:]:
                category_weights.append(0.5)  # Secondary terms
    
    if not category_terms:
        return 0.0, []
    
    # Get semantic matches
    semantic_matches = await semantic_matcher.semantic_match(text, category_terms)
    semantic_scores = {m.text: m.score for m in semantic_matches}
    
    # Lexical matching
    matched_terms = []
    matched_primary = set()
    matched_secondary = set()
    score = 0.0
    
    for i, term in enumerate(category_terms):
        weight = category_weights[i]
        term_matched = False
        
        # Check semantic match first if we have a semantic matcher
        if semantic_matcher and semantic_scores:
            semantic_score = semantic_scores.get(term, 0)
            # Lower threshold for semantic matches to catch more potential matches
            if semantic_score > 0.6:  # Reduced from 0.7 to 0.6 for more flexibility
                # Boost score based on match confidence
                score_boost = 1.0 + (semantic_score - 0.6) * 0.5  # 1.0-1.2x boost
                score += semantic_score * weight * score_boost
                matched_terms.append({
                    'term': term,
                    'type': 'semantic',
                    'score': semantic_score,
                    'weight': weight,
                    'boost': score_boost
                })
                term_matched = True
                
                if weight == 1.0:
                    matched_primary.add(term)
                else:
                    matched_secondary.add(term)
        
        # Fall back to lexical matching if no good semantic match
        if not term_matched:
            # Exact match
            if term in text_tokens:
                score += 1.0 * weight
                matched_terms.append({
                    'term': term,
                    'type': 'exact',
                    'score': 1.0,
                    'weight': weight
                })
                term_matched = True
                if weight == 1.0:
                    matched_primary.add(term)
                else:
                    matched_secondary.add(term)
            
            # Partial match for longer terms
            elif len(term) > 3:
                for token in text_tokens:
                    if len(token) < 3:
                        continue
                        
                    if (term in token or token in term) and \
                       abs(len(term) - len(token)) <= 2:
                        partial_score = 0.5
                        score += partial_score * weight
                        matched_terms.append({
                            'term': f"{term}~{token}",
                            'type': 'partial',
                            'score': partial_score,
                            'weight': weight
                        })
                        if weight == 1.0:
                            matched_primary.add(term)
                        else:
                            matched_secondary.add(term)
                        break
    
    # Calculate base score with enhanced semantic matching
    total_weight = sum(category_weights)
    if total_weight > 0:
        normalized_score = min(1.0, score / total_weight)
    else:
        normalized_score = 0.0
    
    # Add bonuses
    bonuses = 0.0
    
    # Primary term bonus - increased for semantic matches
    if matched_primary:
        # Higher bonus for semantic matches
        semantic_primary = sum(1 for t in matched_terms if t['type'] == 'semantic' and t['weight'] == 1.0)
        primary_bonus = min(0.3, len(matched_primary) * 0.1 + semantic_primary * 0.05)  # Extra boost for semantic matches
        normalized_score = min(1.0, normalized_score + primary_bonus)
        bonuses += primary_bonus
    
    # Secondary term bonus - reward having multiple matches
    if matched_secondary:
        semantic_secondary = sum(1 for t in matched_terms if t['type'] == 'semantic' and t['weight'] < 1.0)
        secondary_bonus = min(0.15, len(matched_secondary) * 0.03 + semantic_secondary * 0.02)
        normalized_score = min(1.0, normalized_score + secondary_bonus)
        bonuses += secondary_bonus
    
    # Urgency bonus - increased weight for urgent requests
    urgency_matches = [w for w in URGENCY_WORDS if w in text_tokens]
    if urgency_matches:
        urgency_bonus = min(0.2, len(urgency_matches) * 0.07)  # Slightly higher bonus for urgency
        normalized_score = min(1.0, normalized_score + urgency_bonus)
        bonuses += urgency_bonus
        
    # Context bonus - if we have multiple related terms matched
    if len(matched_primary) + len(matched_secondary) >= 2:
        context_bonus = 0.1
        normalized_score = min(1.0, normalized_score + context_bonus)
        bonuses += context_bonus
    
    # Debug output
    if DEBUG:
        print(f"  Matching against offer: {offer.get('id', 'No ID')} - {offer.get('title', 'No title')}")
        print(f"  Offer categories: {offer.get('categories', [])}")
        
        if matched_terms:
            print("  Matches:")
            for match in sorted(matched_terms, key=lambda x: x['score'] * x['weight'], reverse=True):
                print(f"    [{match['type'].upper()}] {match['term']} (score: {match['score']:.2f}, weight: {match['weight']:.1f})")
        
        print("  Scoring details:")
        print(f"    Base score: {score:.3f} / {total_weight:.3f} = {score/max(1, total_weight):.3f}")
        if matched_primary:
            print(f"    Primary matches: {', '.join(sorted(matched_primary))}")
        if matched_secondary:
            print(f"    Secondary matches: {', '.join(sorted(matched_secondary))}")
        if urgency_matches:
            print(f"    Urgency words: {', '.join(urgency_matches)}")
        
        print(f"  Final score: {normalized_score:.3f} (base: {score/max(1, total_weight):.3f}, bonuses: {bonuses:.3f})")
    
    return min(1.0, max(0.0, normalized_score)), matched_terms

async def resonance_score(
    lead: dict, 
    offer: dict, 
    labels: list[str], 
    tokens: set[str],
    semantic_matcher: Optional[SemanticMatcher] = None
) -> Tuple[float, Dict[str, Any]]:
    """Calculate overall resonance score (0.0-1.0) with semantic understanding.
    
    Args:
        lead: Lead dictionary with text and metadata
        offer: Offer dictionary with categories and metadata
        labels: List of intent labels
        tokens: Set of normalized text tokens
        semantic_matcher: Optional SemanticMatcher instance
        
    Returns:
        Tuple of (score, details) where details contains scoring breakdown
    """
    DEBUG = True
    
    # Initialize semantic matcher if not provided
    if semantic_matcher is None:
        semantic_matcher = SemanticMatcher()
    
    # Get normalized text for semantic analysis
    lead_text = normalize_text(lead)
    
    if DEBUG:
        print("\n" + "="*80)
        print(f"DEBUG: Scoring lead against offer: {offer.get('id', 'unknown')}")
        print(f"  Lead text: {lead_text[:200]}...")
        print(f"  Offer categories: {offer.get('categories', [])}")
    
    # Calculate recency score (0.0-1.0)
    recency_score = _get_recency_score(lead.get('created_at', ''))
    
    # Enhanced intent detection with semantic analysis
    intent_scores = {
        'needs_help': 0.0,
        'wants_to_buy': 0.0,
        'seeking_recommendation': 0.0,
        'has_problem': 0.0,
        'general_inquiry': 0.0
    }
    
    # Get semantic intent classification
    semantic_intent = await semantic_matcher.classify_intent(lead_text)
    intent_scores[semantic_intent] = 1.0  # Full score for primary intent
    
    # Legacy label-based scoring (kept for backward compatibility)
    if 'explicit_ask' in labels:
        intent_scores['needs_help'] = max(intent_scores['needs_help'], 0.8)
    if 'buy_signal' in labels:
        intent_scores['wants_to_buy'] = max(intent_scores['wants_to_buy'], 0.9)
    if 'pain' in labels:
        intent_scores['has_problem'] = max(intent_scores['has_problem'], 0.9)
    
    # Calculate overall intent score (weighted average)
    intent_weights = {
        'wants_to_buy': 0.4,
        'needs_help': 0.3,
        'has_problem': 0.2,
        'seeking_recommendation': 0.1,
        'general_inquiry': 0.0  # No weight for general inquiries
    }
    
    total_weight = sum(intent_weights.values())
    intent_score = sum(
        score * intent_weights.get(intent, 0) 
        for intent, score in intent_scores.items()
    ) / (total_weight or 1.0)
    
    # Calculate semantic match score
    match_score, match_details = await offer_match_score(
        text=lead_text,
        text_tokens=tokens,
        offer=offer,
        semantic_matcher=semantic_matcher
    )
    
    # Extract entities for additional context
    entities = await semantic_matcher.extract_entities(lead_text)
    
    # Calculate the final weighted score (0-1 scale)
    # - Recency: 20% weight (fresher is better)
    # - Intent: 30% weight (higher for more actionable intents)
    # - Match: 50% weight (semantic/lexical match quality)
    # Adjusted to give more weight to recency and slightly less to intent
    
    weights = {
        'recency': 0.25,  # Increased weight for recency
        'intent': 0.25,  # Reduced weight for intent
        'match': 0.50     # Kept high but now includes semantic matching
    }
    
    final_score = (
        recency_score * weights['recency'] +
        intent_score * weights['intent'] +
        match_score * weights['match']
    )
    
    # Prepare detailed scoring breakdown
    scoring_details = {
        'recency': {
            'score': recency_score,
            'weight': weights['recency'],
            'weighted': recency_score * weights['recency']
        },
        'intent': {
            'score': intent_score,
            'weight': weights['intent'],
            'weighted': intent_score * weights['intent'],
            'details': {
                'semantic_intent': semantic_intent,
                'intent_scores': intent_scores,
                'labels': labels
            }
        },
        'match': {
            'score': match_score,
            'weight': weights['match'],
            'weighted': match_score * weights['match'],
            'details': match_details
        },
        'entities': entities,
        'final_score': final_score
    }
    
    if DEBUG:
        print("\n  Component scores:")
        print(f"  - Recency: {recency_score:.3f} ({weights['recency']*100:.0f}% weight: {recency_score * weights['recency']:.3f})")
        
        print("  - Intent (semantic):")
        print(f"      Primary intent: {semantic_intent} (score: {intent_scores[semantic_intent]:.2f})")
        print("      All intents:")
        for intent, score in sorted(intent_scores.items(), key=lambda x: x[1], reverse=True):
            if score > 0.1:  # Only show significant intents
                print(f"        {intent}: {score:.2f}")
        print(f"      Final intent score: {intent_score:.3f} ({weights['intent']*100:.0f}% weight: {intent_score * weights['intent']:.3f})")
        
        print(f"  - Match: {match_score:.3f} ({weights['match']*100:.0f}% weight: {match_score * weights['match']:.3f})")
        
        if entities and any(entities.values()):
            print("  Extracted entities:")
            for entity_type, values in entities.items():
                if values:
                    print(f"    - {entity_type}: {', '.join(values)}")
        
        print("\n  Final weighted score:")
        print(f"  {recency_score:.3f} (recency) + {intent_score:.3f} (intent) + {match_score:.3f} (match) = {final_score:.3f}")
        print("="*80 + "\n")
    
    return final_score, scoring_details

def normalize_text(text: Union[str, dict]) -> str:
    """Normalize text by lowercasing and removing special characters.
    
    Args:
        text: Either a string or a dictionary with 'title' and 'text' keys
        
    Returns:
        Normalized text string
    """
    if not text:
        return ""
        
    # Handle dictionary input (like a lead object)
    if isinstance(text, dict):
        title = text.get('title', '')
        body = text.get('text', '')
        text = f"{title} {body}"
    
    # Ensure we have a string
    if not isinstance(text, str):
        text = str(text)
        
    text = re.sub(r'[^a-z0-9\s]', ' ', text.lower())
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def get_tokens(text: str) -> List[str]:
    """Tokenize text into words, applying stopwords and min length."""
    if not text:
        return []
    
    tokens = []
    stopwords = set(CFG.get("normalization", {}).get("stopwords", []))
    min_len = CFG.get("normalization", {}).get("min_token_len", 2)
    
    normalized_text = normalize_text(text)
    print(f"Normalized text in get_tokens: {normalized_text}")
    print(f"Stopwords: {stopwords}")
    print(f"Min token length: {min_len}")
    
    for word in normalized_text.split():
        if len(word) >= min_len and word not in stopwords:
            tokens.append(word)
        else:
            print(f"Filtered out token: '{word}' (length: {len(word)}, in stopwords: {word in stopwords})")
    
    print(f"Final tokens: {tokens}")
    return tokens

# ---- Matching Logic ----
def score_lead(lead: Dict, offers: Dict) -> Optional[Dict]:
    """Score lead against all offers, return best match if above threshold."""
    # Save original stdout and stderr
    original_stdout = sys.stdout
    original_stderr = sys.stderr
    
    # Redirect all output to a debug file
    debug_file = Path("debug_output.txt")
    with open(debug_file, 'a', encoding='utf-8') as f:
        sys.stdout = f
        sys.stderr = f
        
        try:
            if not lead or not offers:
                print("Debug: No lead or offers to score", file=sys.stderr)
                return None
                
            # Normalize and tokenize lead text
            text = normalize_text(lead)
            tokens = set(get_tokens(text))  # Convert to set for faster lookups
            labels = label_intents(text)
            
            print("\n" + "="*80)
            print(f"SCORING LEAD: {lead.get('title', 'No title')}")
            print(f"Source: {lead.get('source', 'unknown')}")
            print(f"URL: {lead.get('url', 'No URL')}")
            print(f"Raw text: {json.dumps(lead, indent=2)}")
            print(f"Normalized text: {text[:500]}...")
            print(f"Tokens: {sorted(tokens)}")
            print(f"Intent labels: {labels}")
            print("-"*40)
            
        except Exception as e:
            print(f"Error processing lead: {e}", file=sys.stderr)
            return None
    
    best_match = None
    best_score = 0.0
    
    for offer_id, offer in offers.items():
        score = resonance_score(lead, offer, labels, tokens)
        scaled_score = score * 100  # Convert to 0-100 scale
        
        print(f"\nDebug: Scoring against offer {offer_id}", file=sys.stderr)
        print(f"Debug: Offer categories - {offer.get('categories', [])}", file=sys.stderr)
        print(f"Debug: Raw score: {score:.2f}, Scaled: {scaled_score:.1f}", file=sys.stderr)
        
        if scaled_score > best_score:
            best_score = scaled_score
            best_match = {
                'offer_id': offer_id,
                'score': scaled_score,
                'labels': labels,
                'categories': offer.get('categories', []),
                'url': offer.get('landing_urls', [''])[0],
                'title': lead.get('title', ''),
                'source': lead.get('source', 'unknown'),
                'text_preview': text[:200] + '...' if text else ''
            }
            print(f"Debug: New best match - {offer_id} with score {scaled_score:.1f}", file=sys.stderr)
    
    # Only return matches above the minimum threshold
    # Convert to 0-100 scale for this check to maintain compatibility
    scaled_threshold = MIN_RESONANCE_SCORE * 100
    if best_score >= scaled_threshold:
        print(f"Debug: Found match with score {best_score:.1f} >= {scaled_threshold}", file=sys.stderr)
        return best_match
    else:
        print(f"Debug: No matches above threshold {scaled_threshold}. Best score was {best_score:.1f}", file=sys.stderr)
        return None

# ---- Slack payload (ASCII-only bullets/arrows) ----
def to_slack_blocks(cards):
    """Convert cards to Slack message format with ASCII-only characters."""
    lines = []
    for c in cards:
        title = c["title"]
        url = c.get("url") or ""
        m = c.get("match") or {}
        offer = m.get("offer_id") or ""
        reason = m.get("reason") or ""
        route = m.get("landing_url") or ""
        score = m.get("score", 0)
        
        # Format as markdown link if URL available
        title_display = f"<{url}|{title}>".replace("|", "\|") if url else title
        route_display = f"<{route}|{offer}>".replace("|", "\|") if route and offer else offer
        
        # Add to output
        lines.append(f"• {title_display}")
        if route_display:
            lines.append(f"  → {route_display} (score: {score}, {reason})")
        elif reason:
            lines.append(f"  → {reason}")
        lines.append("")  # Empty line between cards
    
    # Convert to Slack blocks format (simplified)
    return {
        "blocks": [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "\n".join(lines).strip()
                }
            }
        ]
    }

def calculate_resonance(metrics):
    """Calculate resonance score from metrics (0-100)."""
    return sum([
        metrics.get('need_intensity', 0),
        metrics.get('constraint_strength', 0),
        metrics.get('freshness', 0),
        metrics.get('solvability', 0),
        metrics.get('contactability', 0)
    ])

def process_lead(lead, offers, writer):
    """Process a single lead and write results to writer."""
    try:
        # Score the lead against all offers
        match = score_lead(lead, offers)
        
        # Calculate metrics
        metrics = {
            'goal_present': any(word in lead.get('text', '').lower() 
                             for word in ['need', 'want', 'looking for', 'searching for']),
            'constraint_types': [],  # Populated based on your specific logic
            'need_intensity': 0,     # Populate based on your specific logic
            'constraint_strength': 0, # Populate based on your specific logic
            'freshness': 0,          # Populate based on your specific logic
            'solvability': 0,        # Populate based on your specific logic
            'contactability': 0      # Populate based on your specific logic
        }
        
        # Calculate resonance score
        resonance2 = calculate_resonance(metrics)
        
        # Prepare result row
        row = {
            'source': lead.get('source', 'unknown'),
            'resonance2': round(resonance2, 1),
            'constraint_types': str(metrics['constraint_types']),
            'url': lead.get('url', ''),
            'routed_offer': match.get('landing_url', '') if match else '',
            'reason': match.get('reason', 'no_match') if match else 'no_match',
            'extract_snippet': (lead.get('text', '')[:200] + '...') if lead.get('text') else '',
            'goal_present': str(metrics['goal_present']).lower(),
            'need_intensity': metrics['need_intensity'],
            'constraint_strength': metrics['constraint_strength'],
            'freshness': round(metrics['freshness'], 1),
            'solvability': metrics['solvability'],
            'contactability': metrics['contactability']
        }
        
        # Write the row
        writer.writerow(row)
        return row, 1 if match else 0
        
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON line: {e}", file=sys.stderr)
        return None, 0
    
    return results, total, matched

def print_summary(results: list, total: int, matched: int):
    """Print a summary of the results."""
    print(f"\nSummary:")
    print(f"- Total leads processed: {total}")
    print(f"- Matches found: {matched} ({matched/max(1, total)*100:.1f}%)")
    
    if not results:
        return
    
    # Show top matches by resonance2
    print("\nTop matches:")
    print(f"{'Source':<8} | {'Resonance':>9} | {'Constraints':<15} | URL")
    print("-" * 80)
    
    for row in sorted(results, key=lambda x: x['resonance2'], reverse=True)[:20]:
        print(f"{row['source']:<8} | {row['resonance2']:>9.1f} | {row['constraint_types'][:15]:<15} | {row['url']}")

def merge_jsonl_files(output_file: Path, *input_files: Path) -> int:
    """Merge multiple JSONL files into one with deduplication."""
    seen_hashes: Set[str] = set()
    total = 0
    
    with open(output_file, 'w', encoding='utf-8') as out_f:
        for input_file in input_files:
            if not input_file.exists():
                print(f"Warning: {input_file} not found, skipping")
                continue
                
            with open(input_file, 'r', encoding='utf-8') as in_f:
                for line in in_f:
                    try:
                        item = json.loads(line)
                        # Create a unique hash for deduplication
                        content = item.get('text', '') + item.get('url', '')
                        content_hash = hashlib.sha1(content.encode('utf-8')).hexdigest()
                        
                        if content_hash not in seen_hashes:
                            seen_hashes.add(content_hash)
                            out_f.write(line)
                            total += 1
                    except json.JSONDecodeError:
                        continue
    
    return total


async def process_lead_jsonl(
    input_file: Path, 
    output_file: Path, 
    offers: dict, 
    hours: int = 24,
    semantic_matcher: Optional[SemanticMatcher] = None
) -> Tuple[list, int, int]:
    """Process a JSONL file of leads with semantic matching and write matches to CSV.
    
    Args:
        input_file: Path to input JSONL file
        output_file: Path to output CSV file
        offers: Dictionary of offers
        hours: Number of hours to look back for leads
        semantic_matcher: Optional SemanticMatcher instance
        
    Returns:
        Tuple of (results, total_processed, matched_count)
    """
    results = []
    total_processed = 0
    matched_count = 0
    
    # Initialize semantic matcher if not provided
    if semantic_matcher is None:
        semantic_matcher = SemanticMatcher()
    
    # Get current time for age filtering
    now = _now_utc()
    cutoff = now - timedelta(hours=hours)
    
    # Prepare CSV writer
    with open(output_file, 'w', newline='', encoding='utf-8') as f_out:
        fieldnames = [
            'lead_id', 'lead_text', 'offer_id', 'offer_title', 'score',
            'matched_terms', 'timestamp', 'intent_labels', 'semantic_intent',
            'entities', 'scoring_details'
        ]
        writer = csv.DictWriter(f_out, fieldnames=fieldnames)
        writer.writeheader()
        
        # Process each line in the input file
        with open(input_file, 'r', encoding='utf-8') as f_in:
            for line in f_in:
                try:
                    # Parse JSON line
                    lead = json.loads(line.strip())
                    
                    # Skip if lead is too old
                    lead_time = _parse_timestamp(lead.get('created_at', ''))
                    if lead_time and lead_time < cutoff:
                        continue
                    
                    # Extract and normalize text
                    text = normalize_text(lead)
                    if not text:
                        continue
                    
                    # Tokenize and label intents
                    tokens = tokens_from_text(text)
                    labels = label_intents(text)
                    
                    # Get semantic analysis
                    semantic_intent = await semantic_matcher.classify_intent(text)
                    entities = await semantic_matcher.extract_entities(text)
                    
                    # Score against each offer
                    best_match = None
                    best_score = 0.0
                    best_details = None
                    
                    for offer_id, offer in offers.items():
                        if not offer.get('categories'):
                            continue
                            
                        if asyncio.iscoroutinefunction(resonance_score):
                            score, scoring_details = await resonance_score(
                                lead=lead,
                                offer=offer,
                                labels=labels,
                                tokens=tokens,
                                semantic_matcher=semantic_matcher
                            )
                        else:
                            score, scoring_details = resonance_score(
                                lead=lead,
                                offer=offer,
                                labels=labels,
                                tokens=tokens,
                                semantic_matcher=semantic_matcher
                            )
                        
                        if score > best_score and score >= MIN_RESONANCE_SCORE:
                            best_score = score
                            best_match = {
                                'offer_id': offer_id,
                                'offer_title': offer.get('title', ''),
                                'score': score,
                                'matched_terms': [
                                    m['term'] for m in scoring_details['match'].get('details', [])
                                    if m.get('score', 0) > 0.5
                                ],
                                'intent_labels': labels,
                                'semantic_intent': semantic_intent,
                                'entities': entities,
                                'scoring_details': json.dumps(scoring_details, default=str)
                            }
                            best_details = scoring_details
                    
                    # If we found a match, write to CSV
                    if best_match and best_score >= MIN_RESONANCE_SCORE:
                        row = {
                            'lead_id': lead.get('id', ''),
                            'lead_text': text[:500],  # Truncate long text
                            'offer_id': best_match['offer_id'],
                            'offer_title': best_match['offer_title'],
                            'score': f"{best_score:.4f}",
                            'matched_terms': ', '.join(best_match.get('matched_terms', [])),
                            'timestamp': lead.get('created_at', ''),
                            'intent_labels': ', '.join(best_match.get('intent_labels', [])),
                            'semantic_intent': best_match.get('semantic_intent', ''),
                            'entities': json.dumps(best_match.get('entities', {})),
                            'scoring_details': best_match.get('scoring_details', '')
                        }
                        writer.writerow(row)
                        
                        matched_count += 1
                        
                        # Add to results
                        results.append({
                            'lead_id': lead.get('id'),
                            'offer_id': best_match['offer_id'],
                            'score': best_score,
                            'timestamp': lead.get('created_at'),
                            'details': best_details
                        })
                    
                    total_processed += 1
                    
                    # Print progress
                    if total_processed % 10 == 0:
                        print(f"Processed {total_processed} leads, {matched_count} matches")
                    
                except json.JSONDecodeError as e:
                    print(f"Error parsing JSON: {e}")
                    continue
                except Exception as e:
                    print(f"Error processing lead: {e}")
                    if DEBUG:
                        import traceback
                        traceback.print_exc()
                    continue
    
    print(f"\nProcessing complete. Processed {total_processed} leads, found {matched_count} matches.")
    print(f"Match rate: {matched_count/max(1, total_processed)*100:.1f}%")
    
    return results, total_processed, matched_count

def print_summary(results: list, total: int, matched: int):
    """Print a summary of the results."""
    print(f"\nSummary:")
    print(f"- Total leads processed: {total}")
    print(f"- Matches found: {matched} ({matched/max(1, total)*100:.1f}%)")
    
    if not results:
        return
    
    # Show top matches by resonance2
    print("\nTop matches:")
    print(f"{'Source':<8} | {'Resonance':>9} | {'Constraints':<15} | URL")
    print("-" * 80)
    
    for row in sorted(results, key=lambda x: x['resonance2'], reverse=True)[:20]:
        print(f"{row['source']:<8} | {row['resonance2']:>9.1f} | {row['constraint_types'][:15]:<15} | {row['url']}")

def merge_jsonl_files(output_file: Path, *input_files: Path) -> int:
    """Merge multiple JSONL files into one with deduplication."""
    seen_hashes: Set[str] = set()
    total = 0
    
    with open(output_file, 'w', encoding='utf-8') as out_f:
        for input_file in input_files:
            if not input_file.exists():
                print(f"Warning: {input_file} not found, skipping")
                continue
                
            with open(input_file, 'r', encoding='utf-8') as in_f:
                for line in in_f:
                    try:
                        item = json.loads(line)
                        # Create a unique hash for deduplication
                        content = item.get('text', '') + item.get('url', '')
                        content_hash = hashlib.sha1(content.encode('utf-8')).hexdigest()
                        
                        if content_hash not in seen_hashes:
                            seen_hashes.add(content_hash)
                            out_f.write(line)
                            total += 1
                    except json.JSONDecodeError:
                        continue
    
    return total


async def process_lead_jsonl(input_file: Path, output_file: Path, offers: dict, hours: int = 24, semantic_matcher: Optional[SemanticMatcher] = None) -> Tuple[list, int, int]:
    """
    Process a JSONL file containing leads and write results to CSV.
    
    Args:
        input_file: Path to input JSONL file
        output_file: Path to output CSV file
        offers: Dictionary of offers to match against
        hours: Time window in hours to consider for freshness
        
    Returns:
        Tuple of (results, total_leads, matched_count)
    """
    if not input_file.exists():
        print(f"Error: Input file {input_file} does not exist", file=sys.stderr)
        return [], 0, 0
        
    results = []
    total_processed = 0
    matched_count = 0
    cutoff_time = _now_utc() - timedelta(hours=hours)
    
    # Create output directory if it doesn't exist
    output_file.parent.mkdir(parents=True, exist_ok=True)
    
    with open(input_file, 'r', encoding='utf-8', errors='replace') as infile, \
         open(output_file, 'w', newline='', encoding='utf-8') as outfile:
        
        writer = csv.DictWriter(outfile, fieldnames=[
            'source', 'url', 'offer', 'score', 'labels', 'title', 'created_at'
        ])
        writer.writeheader()
        
        for line_num, line in enumerate(infile, 1):
            try:
                # Skip empty lines
                line = line.strip()
                if not line:
                    continue
                    
                try:
                    lead = json.loads(line)
                except json.JSONDecodeError:
                    # If line is not valid JSON, treat it as plain text
                    lead = {'text': line}
                
                # Ensure lead is a dictionary
                if not isinstance(lead, dict):
                    lead = {'text': str(lead)}
                
                # Ensure required fields exist with defaults
                lead.setdefault('id', f'lead_{line_num}')
                lead.setdefault('source', 'unknown')
                lead.setdefault('created_at', '')
                lead.setdefault('text', '')
                
                # If no text but there's a 'title', use that
                if not lead['text'] and 'title' in lead:
                    lead['text'] = lead['title']
                
                total_processed += 1
                
                # Skip if lead is too old
                created_at = lead.get('created_at', '')
                if created_at and isinstance(created_at, str):
                    try:
                        # Handle both timezone-aware and naive timestamps
                        if created_at.endswith('Z'):
                            lead_time = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                        else:
                            lead_time = datetime.fromisoformat(created_at)
                            if lead_time.tzinfo is None:
                                lead_time = lead_time.replace(tzinfo=timezone.utc)
                        
                        if lead_time < cutoff_time:
                            if DEBUG:
                                print(f"Skipping - Lead is too old")
                            continue
                    except Exception as e:
                        print(f"Error parsing timestamp: {e}", file=sys.stderr)
                        continue
                
                # Normalize and process text
                
                # Normalize and process text
                text = normalize_text_from_lead(lead)
                if not text:
                    if DEBUG:
                        print("Skipping - No valid text content found")
                    continue
                
                if DEBUG:
                    print(f"\n{'='*40}")
                    print(f"PROCESSING LEAD #{line_num}")
                    print(f"TITLE: {lead.get('title', 'No title')}")
                    print(f"TEXT: {text[:200]}...")
                
                tokens = tokens_from_text(text)
                labels = label_intents(text)
                
                if DEBUG:
                    print(f"TOKENS: {sorted(tokens)}")
                    print(f"LABELS: {labels}")
                
                # Score against each offer
                any_match = False
                for offer_id, offer in offers.items():
                    if DEBUG:
                        print(f"\nSCORING AGAINST OFFER: {offer_id}")
                        print(f"OFFER CATEGORIES: {offer.get('categories', [])}")
                    
                    # Handle both sync and async versions of resonance_score
                    score_result = resonance_score(lead, offer, labels, tokens, semantic_matcher)
                    
                    # Handle both sync and async return values
                    if asyncio.iscoroutine(score_result):
                        score, _ = await score_result
                    elif isinstance(score_result, tuple):
                        score = score_result[0]  # First item is the score
                    else:
                        score = score_result
                    
                    if DEBUG:
                        print(f"FINAL SCORE FOR {offer_id}: {score:.3f} (THRESHOLD: {MIN_RESONANCE_SCORE})")
                    
                    if score >= MIN_RESONANCE_SCORE:
                        any_match = True
                        matched_count += 1
                        result = {
                            'source': lead.get('source', ''),
                            'url': lead.get('url', ''),
                            'offer': offer_id,
                            'score': score,
                            'labels': '|'.join(labels) if labels else '',
                            'title': lead.get('title', '')[:200],
                            'created_at': created_at
                        }
                        results.append(result)
                        writer.writerow(result)
                        
                        if DEBUG:
                            print("\n" + "!"*80)
                            print(f"MATCH FOUND!")
                            print(f"LEAD: {lead.get('title', 'No title')}")
                            print(f"OFFER: {offer_id}")
                            print(f"SCORE: {score:.3f}")
                            print("!"*80 + "\n")
                
                if DEBUG and not any_match:
                    print("\nNo matches found for this lead against any offers")
                        
            except json.JSONDecodeError as e:
                print(f"Error decoding JSON on line {line_num}: {e}", file=sys.stderr)
                continue
            except Exception as e:
                print(f"Error processing line {line_num}: {e}", file=sys.stderr)
                if DEBUG:
                    import traceback
                    traceback.print_exc()
                continue
    
    # Return the results
    return results, total_processed, matched_count

def main():
    """
    Main entry point for the script.
    
    Processes live data from various sources, scores leads against offers,
    and generates previews and next actions.
    """
    parser = argparse.ArgumentParser(description='Process live data and generate previews.')
    
    # Handle both formats: --input-jsonl (from PowerShell) and input_jsonl (positional)
    parser.add_argument('--input-jsonl', dest='input_jsonl', type=Path, 
                      help='Path to input JSONL file')
    parser.add_argument('input_jsonl_pos', nargs='?', type=Path, 
                      help=argparse.SUPPRESS)  # Hidden positional argument
    
    parser.add_argument('--output-dir', type=Path, default='output',
                      help='Directory for output files (default: output/)')
    parser.add_argument('--hours', type=int, default=24,
                      help='Time window in hours to process (default: 24)')
    parser.add_argument('--min-score', type=float, default=0.3,
                      help='# Minimum resonance score to consider a match (0-1 scale)')
    
    # Debug flag
    DEBUG = True
    
    args = parser.parse_args()
    
    # Use positional argument if --input-jsonl not provided
    input_jsonl = args.input_jsonl or args.input_jsonl_pos
    if not input_jsonl:
        parser.error("No input file specified. Use --input-jsonl or provide as positional argument.")
    
    # Ensure output directory exists
    args.output_dir.mkdir(parents=True, exist_ok=True)
    output_csv = args.output_dir / 'previews.csv'
    
    # Initialize metrics
    metrics = Metrics()
    
    try:
        print(f"Processing leads from: {input_jsonl}")
        print(f"Output directory: {args.output_dir.absolute()}")
        print(f"Time window: {args.hours} hours")
        print(f"Minimum score threshold: {args.min_score:.1f}\n")
        
        # Load offers
        offers = load_offers()
        if not offers:
            print("Error: No offers loaded", file=sys.stderr)
            return 1
            
        # Process the input file
        results, total_leads, matched_count = process_lead_jsonl(
            input_jsonl, 
            output_csv, 
            offers,
            hours=args.hours
        )
        
        # Update metrics
        metrics.merged = total_leads
        metrics.queued_resonance60 = len([r for r in results if r.get('score', 0) >= 60])
        
        # Filter results by minimum score
        filtered_results = [r for r in results if r.get('score', 0) >= args.min_score]
        
        # Generate next actions
        next_actions_path = args.output_dir / 'next_actions.csv'
        with open(next_actions_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['offer_id', 'action', 'priority', 'score', 'source', 'categories', 'details'])
            
            for r in sorted(filtered_results, key=lambda x: x.get('score', 0), reverse=True):
                # Determine priority based on score and labels
                if r.get('score', 0) >= 70 or (r.get('labels') and 'explicit_ask' in r['labels']):
                    priority = 'high'
                elif r.get('score', 0) >= 50 or (r.get('labels') and 'buying_signal' in r['labels']):
                    priority = 'medium'
                else:
                    priority = 'low'
                
                writer.writerow([
                    r.get('offer_id', ''),
                    'review_lead',
                    priority,
                    f"{r.get('score', 0):.1f}",
                    r.get('source', 'unknown'),
                    ','.join(r.get('categories', [])[:2]),
                    f"Match score: {r.get('score', 0):.1f}, Labels: {','.join(r.get('labels', []))}"
                ])
        
        # Prepare summary
        results_summary = {
            "total_leads": metrics.merged,
            "total_matches": len(filtered_results),
            "high_resonance_matches": metrics.queued_resonance60,
            "match_rate": round(len(filtered_results) / max(1, metrics.merged) * 100, 1),
            "samples": filtered_results[:10]  # Include first 10 results in summary
        }
        
        # Write summary to JSON
        summary_path = args.output_dir / 'summary.json'
        with open(summary_path, 'w', encoding='utf-8') as f:
            json.dump(results_summary, f, indent=2)
        
        # Print final summary
        print("\n=== Processing Complete ===")
        print(f"Total leads processed: {metrics.merged}")
        print(f"Total matches found: {len(filtered_results)}")
        print(f"High-resonance matches: {metrics.queued_resonance60}")
        print(f"\nOutput files:")
        print(f"- Previews: {output_csv.absolute()}")
        print(f"- Next actions: {next_actions_path.absolute()}")
        print(f"- Summary: {summary_path.absolute()}")
        
        return 0
        
    except FileNotFoundError as e:
        print(f"Error: File not found - {e}", file=sys.stderr)
        return 1
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in input file - {e}", file=sys.stderr)
        return 1
    except Exception as e:
        print(f"Unexpected error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    main()
