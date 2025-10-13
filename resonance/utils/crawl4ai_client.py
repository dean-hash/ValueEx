"""
Crawl4AI Client for web scraping and data extraction.

This module provides a client for interacting with a Crawl4AI instance.
It handles communication with the Crawl4AI API and provides helper methods
for common web scraping tasks.
"""
import asyncio
import json
from typing import Any, Dict, List, Optional, Union
import os
from env_utils import env
import aiohttp
from loguru import logger

class Crawl4AIClient:
    """Client for interacting with a Crawl4AI instance."""
    
    def __init__(self, base_url: Optional[str] = None, api_key: Optional[str] = None):
        """Initialize the Crawl4AI client.
        
        Args:
            base_url: Base URL of the Crawl4AI instance (default: http://localhost:11235)
            api_key: Optional API key for authentication
        """
        if base_url is None:
            base_url = env.get("CRAWL4AI_URL", "http://localhost:11235")
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key or env.get("CRAWL4AI_API_KEY")
        self.session = None
        self.timeout = aiohttp.ClientTimeout(total=300)  # 5 minute timeout

    async def __aenter__(self):
        """Async context manager entry."""
        self.session = aiohttp.ClientSession(timeout=self.timeout)
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        if self.session:
            await self.session.close()
            self.session = None

    async def _make_request(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        """Make an HTTP request to the Crawl4AI API.
        
        Args:
            method: HTTP method (GET, POST, etc.)
            endpoint: API endpoint (e.g., '/crawl')
            **kwargs: Additional arguments to pass to the request
            
        Returns:
            Dict containing the JSON response
            
        Raises:
            aiohttp.ClientError: If the request fails
        """
        if not self.session:
            raise RuntimeError("Session not initialized. Use async with Crawl4AIClient() as client:")
            
        url = f"{self.base_url}{endpoint}"
        headers = kwargs.pop('headers', {})
        
        if self.api_key:
            headers['Authorization'] = f"Bearer {self.api_key}"
            
        # aiohttp handles JSON serialization when using the 'json' kwarg; do not pre-dump here
            
        try:
            async with self.session.request(
                method,
                url,
                headers=headers,
                **kwargs
            ) as response:
                response.raise_for_status()
                return await response.json()
                
        except aiohttp.ClientError as e:
            logger.error(f"Request failed: {str(e)}")
            raise
            
    async def crawl_url(
        self,
        url: str,
        wait_for: int = 0,
        extract_rules: Optional[Dict[str, Any]] = None,
        max_depth: int = 0,
        **kwargs
    ) -> Dict[str, Any]:
        """Crawl a single URL.
        
        Args:
            url: URL to crawl
            wait_for: Time to wait for dynamic content to load (in seconds)
            extract_rules: Custom extraction rules
            **kwargs: Additional arguments to pass to the API
            
        Returns:
            Dict containing the crawl results
        """
        data = {
            "urls": [url],
            "wait_for": wait_for,
            "max_depth": max_depth,
            **kwargs
        }
        
        if extract_rules:
            data["extract_rules"] = extract_rules
            
        return await self._make_request("POST", "/crawl", json=data)
        
    async def extract_content(
        self,
        html: str,
        url: str = "",
        extract_rules: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Extract content from HTML.
        
        Args:
            html: HTML content to extract from
            url: Optional URL for context
            extract_rules: Custom extraction rules
            
        Returns:
            Dict containing the extracted content
        """
        data = {
            "html": html,
            "url": url
        }
        
        if extract_rules:
            data["extract_rules"] = extract_rules
            
        return await self._make_request("POST", "/extract", json=data)
        
    async def get_screenshot(self, url: str, **kwargs) -> bytes:
        """Get a screenshot of a webpage.
        
        Args:
            url: URL to screenshot
            **kwargs: Additional arguments to pass to the API
            
        Returns:
            Bytes containing the screenshot image
        """
        data = {"url": url, **kwargs}
        
        if not self.session:
            raise RuntimeError("Session not initialized. Use async with Crawl4AIClient() as client:")
            
        async with self.session.post(
            f"{self.base_url}/screenshot",
            json=data,
            headers={"Authorization": f"Bearer {self.api_key}"} if self.api_key else {}
        ) as response:
            response.raise_for_status()
            return await response.read()

# Helper function for quick usage
async def crawl_url(url: str, **kwargs) -> Dict[str, Any]:
    """Quick helper to crawl a single URL."""
    async with Crawl4AIClient() as client:
        return await client.crawl_url(url, **kwargs)
