import os
import json
from typing import List, Dict, Set, Optional
import numpy as np
from pathlib import Path
import requests
from dataclasses import dataclass
import logging
import asyncio
import hashlib
import sys

try:
    import numpy as np
except ImportError:
    print("Warning: numpy not installed. Some functionality may be limited.")
    np = None

try:
    import httpx
except ImportError:
    print("Warning: httpx not installed. HTTP requests will not work.")
    httpx = None

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class SemanticMatch:
    text: str
    score: float
    matched_terms: List[str]
    intent: str = ""

class SemanticMatcher:
    def __init__(self, model_name: str = "llama3.1:8b"):  # Changed default to match installed model
        self.model_name = model_name
        self.embeddings_cache = {}
        self.load_cache()
        self.server_available = True  # Assume server is available initially
        self._tested_connection = False  # Track if we've tested the connection
        
        # Predefined intents for classification
        self.INTENT_PROMPTS = {
            'needs_help': "The person needs help with a technical issue or question.",
            'wants_to_buy': "The person is looking to purchase or subscribe to a product/service.",
            'seeking_recommendation': "The person is asking for recommendations or comparisons.",
            'has_problem': "The person is experiencing a problem or issue.",
            'general_inquiry': "A general question or statement that doesn't fit other categories."
        }
        # Alias for backward compatibility
        self.intent_prompts = self.INTENT_PROMPTS
        
        # Initialize Ollama client if available
        self.client = None
        try:
            self.client = httpx.AsyncClient(timeout=5.0)  # Shorter timeout for faster fallback
        except Exception as e:
            print(f"Warning: Failed to initialize HTTP client: {e}")
            self.server_available = False
    
    async def _test_connection(self):
        """Test connection to the Ollama server."""
        if not self.client:
            self.server_available = False
            return
            
        try:
            response = await self.client.get("http://localhost:11434/api/tags", timeout=3.0)
            self.server_available = response.status_code == 200
            if not self.server_available:
                print(f"Warning: Ollama server returned status {response.status_code}")
        except Exception as e:
            self.server_available = False
            print(f"Warning: Ollama server not available: {e}")
    
    async def get_embedding(self, text: str) -> Optional[List[float]]:
        """Get embedding for text, using cache if available."""
        return await self._get_embedding(text)
            
    async def _get_embedding(self, text: str) -> Optional[List[float]]:
        """Get embedding for text, using cache if available."""
        if not text.strip() or not self.client or not self.server_available:
            return None
            
        # Check cache first
        text_hash = hashlib.sha256(text.encode()).hexdigest()
        if text_hash in self.embeddings_cache:
            return self.embeddings_cache[text_hash]
            
        # Ensure server is available
        if not hasattr(self, '_tested_connection'):
            await self._test_connection()
            self._tested_connection = True
            
        if not self.server_available:
            return None
            
        try:
            # Call Ollama API with timeout - using the correct endpoint format
            response = await asyncio.wait_for(
                self.client.post(
                    "http://localhost:11434/api/embeddings",
                    json={"model": self.model_name, "prompt": text},
                    timeout=5.0
                ),
                timeout=10.0  # Overall timeout
            )
            response.raise_for_status()
            
            # Extract embedding and cache it
            result = response.json()
            if isinstance(result, dict):
                # Try different possible response formats
                embedding = result.get("embedding") or result.get("data", [{}])[0].get("embedding")
                if embedding and isinstance(embedding, list):
                    self.embeddings_cache[text_hash] = embedding
                    self._save_cache()
                    return embedding
                
        except asyncio.TimeoutError:
            self.server_available = False
            print("Warning: Ollama server timeout - falling back to lexical matching")
        except Exception as e:
            self.server_available = False
            print(f"Warning: Error getting embedding - {e}")
            
        return None
    
    def _save_cache(self):
        try:
            with open("semantic_cache.json", 'w') as f:
                json.dump(self.embeddings_cache, f)
        except Exception as e:
            logger.error(f"Failed to save cache: {e}")
    
    def load_cache(self):
        try:
            with open("semantic_cache.json", 'r') as f:
                self.embeddings_cache = json.load(f)
        except Exception as e:
            logger.warning(f"Failed to load cache: {e}")
    
    def cosine_similarity(self, a: List[float], b: List[float]) -> float:
        """Calculate cosine similarity between two vectors."""
        if not a or not b or not any(a) or not any(b):
            return 0.0
            
        a_norm = np.linalg.norm(a)
        b_norm = np.linalg.norm(b)
        if a_norm == 0 or b_norm == 0:
            return 0.0
        return np.dot(a, b) / (a_norm * b_norm)
    
    async def classify_intent(self, text: str) -> str:
        """Classify the intent of the text using semantic matching."""
        if not text.strip():
            return "unknown"
            
        text_embedding = await self.get_embedding(text)
        best_intent = "general_inquiry"
        best_score = 0.0
        
        for intent, prompt in self.intent_prompts.items():
            prompt_embedding = await self.get_embedding(prompt)
            score = self.cosine_similarity(text_embedding, prompt_embedding)
            if score > best_score:
                best_score = score
                best_intent = intent
                
        return best_intent if best_score > 0.5 else "general_inquiry"
    
    async def semantic_match(
        self, 
        text: str, 
        target_phrases: List[str],
        threshold: float = 0.6,  # Lower threshold for more matches
        use_categories: bool = True  # Whether to use category-based matching
    ) -> List[SemanticMatch]:
        """
        Find semantic matches between text and target phrases with enhanced flexibility.
        
        Args:
            text: Input text to match against
            target_phrases: List of phrases to match against
            threshold: Similarity threshold (0-1)
            use_categories: Whether to include category-based matches
            
        Returns:
            List of SemanticMatch objects sorted by score (highest first)
        """
        if not text or not target_phrases:
            return []
            
        text_lower = text.lower()
        matches = []
        
        # Get embeddings for the text
        text_embedding = await self.get_embedding(text)
        
        # If we have embeddings, do semantic matching
        if text_embedding and any(text_embedding):
            for phrase in target_phrases:
                # Skip empty phrases
                if not phrase.strip():
                    continue
                    
                # Get embedding for this phrase
                phrase_embedding = await self.get_embedding(phrase)
                if not phrase_embedding:
                    continue
                
                # Calculate similarity
                score = self.cosine_similarity(text_embedding, phrase_embedding)
                
                # Boost score for exact matches
                if phrase.lower() in text_lower:
                    score = max(score, 0.9)  # Boost to ensure it's above threshold
                
                # Add to matches if above threshold
                if score >= threshold:
                    matches.append(SemanticMatch(
                        text=phrase,
                        score=score,
                        matched_terms=[phrase],
                        intent="semantic_match"
                    ))
        
        # Add keyword-based matches as fallback
        for phrase in target_phrases:
            if not phrase.strip():
                continue
                
            # Check for exact match
            if phrase.lower() in text_lower:
                if not any(m.text == phrase for m in matches):
                    matches.append(SemanticMatch(
                        text=phrase,
                        score=0.9,  # High score for exact match
                        matched_terms=[phrase],
                        intent="exact_match"
                    ))
            # Check for partial match
            elif any(word in text_lower.split() for word in phrase.lower().split()):
                if not any(m.text == phrase for m in matches):
                    matches.append(SemanticMatch(
                        text=phrase,
                        score=0.7,  # Medium score for partial match
                        matched_terms=[w for w in phrase.lower().split() if w in text_lower],
                        intent="partial_match"
                    ))
        
        # If using categories, add category-based matches
        if use_categories and not matches:
            entities = await self.extract_entities(text)
            for category in entities.get('categories', []):
                category_matches = [p for p in target_phrases 
                                 if any(tech in p.lower() for tech in 
                                     ['wordpress', 'shopify', 'webflow', 'ecommerce', 'cms', 'hosting'] 
                                     if tech in category)]
                
                for match in category_matches:
                    if not any(m.text == match for m in matches):
                        matches.append(SemanticMatch(
                            text=match,
                            score=0.6,  # Base score for category match
                            matched_terms=[category],
                            intent=f"category_match:{category}"
                        ))
        
        # Deduplicate and sort
        seen = set()
        unique_matches = []
        for m in matches:
            if m.text not in seen:
                seen.add(m.text)
                unique_matches.append(m)
        
        return sorted(unique_matches, key=lambda x: x.score, reverse=True)
    
    async def extract_entities(self, text: str) -> Dict[str, List[str]]:
        """Extract key entities from text with enhanced technology and intent detection."""
        entities = {
            "technologies": [],
            "problems": [],
            "actions": [],
            "time_references": [],
            "categories": []  # Broader categories for more flexible matching
        }
        
        if not text.strip():
            return entities
            
        text_lower = text.lower()
        
        # Expanded technology terms and their categories
        tech_categories = {
            'cms': ['wordpress', 'drupal', 'joomla', 'webflow', 'squarespace', 'wix', 'shopify', 'prestashop', 'magento'],
            'ecommerce': ['shopify', 'woocommerce', 'bigcommerce', 'magento', 'prestashop', 'opencart', 'squarespace', 'wix'],
            'hosting': ['hosting', 'vps', 'dedicated server', 'shared hosting', 'cloud hosting', 'aws', 'google cloud', 'azure', 'digitalocean', 'linode'],
            'web_tech': ['javascript', 'react', 'vue', 'angular', 'node.js', 'php', 'python', 'ruby', 'java', '.net', 'html', 'css', 'sass', 'less'],
            'design': ['ui/ux', 'user interface', 'user experience', 'responsive design', 'mobile first', 'figma', 'sketch', 'adobe xd'],
            'seo': ['seo', 'search engine optimization', 'google analytics', 'google search console', 'semrush', 'ahrefs', 'moz'],
            'marketing': ['email marketing', 'social media', 'content marketing', 'ppc', 'seo', 'conversion rate', 'lead generation']
        }
        
        # Expanded problem terms
        problem_terms = [
            'error', 'issue', 'problem', 'not working', 'broken', 'slow', 'crash', 'down', 'offline',
            'hacked', 'security issue', 'malware', 'virus', 'not loading', 'white screen', '500 error',
            '404 error', 'database error', 'connection failed', 'timeout', 'ssl error', 'mixed content'
        ]
        
        # Expanded action terms
        action_terms = [
            'help', 'fix', 'set up', 'install', 'configure', 'migrate', 'transfer', 'update', 'upgrade',
            'optimize', 'speed up', 'secure', 'backup', 'restore', 'customize', 'design', 'develop',
            'build', 'create', 'launch', 'publish', 'debug', 'troubleshoot', 'resolve', 'solve'
        ]
        
        # Time references
        time_terms = [
            'now', 'urgent', 'asap', 'today', 'this week', 'immediately', 'right away', 'as soon as possible',
            'emergency', 'critical', 'high priority', 'time sensitive', 'deadline', 'due date'
        ]
        
        # Find matching technologies and categories
        found_tech = set()
        found_categories = set()
        
        for category, tech_list in tech_categories.items():
            for tech in tech_list:
                if tech in text_lower:
                    found_tech.add(tech)
                    found_categories.add(category)
        
        # Add partial matches (e.g., 'wordpress' in 'wordpress site')
        words = set(text_lower.split())
        for category, tech_list in tech_categories.items():
            for tech in tech_list:
                tech_words = set(tech.split())
                if tech_words.intersection(words):
                    found_tech.add(tech)
                    found_categories.add(category)
        
        # Add results to entities
        entities["technologies"] = list(found_tech)
        entities["categories"] = list(found_categories)
        entities["problems"] = [p for p in problem_terms if p in text_lower]
        entities["actions"] = [a for a in action_terms if a in text_lower]
        entities["time_references"] = [t for t in time_terms if t in text_lower]
        
        return entities
