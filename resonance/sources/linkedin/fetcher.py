from env_utils import env
from resonance.utils.crawl4ai_client import Crawl4AIClient

class LinkedInFetcher:
    """
    Canonical LinkedIn fetcher.
    - Prefer official API (TODO: add when keys available).
    - Fallback: Crawl4AI for public pages (no auth).
    """
    def __init__(self, *, api_token: str | None = None):
        self.api_token = api_token or env.get("LINKEDIN_API_TOKEN")

    async def fetch_public_page(self, url: str):
        async with Crawl4AIClient() as c:
            return await c.crawl_url(url, max_depth=0)

    # Placeholder for API usage (kept explicit so tests import cleanly)
    async def fetch_profile_via_api(self, member_id: str):
        raise NotImplementedError("LinkedIn v2 API integration not configured.")
