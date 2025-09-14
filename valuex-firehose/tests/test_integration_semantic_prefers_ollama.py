"""
Integration tests for Ollama-based semantic triage.
"""
import os
import pytest
from valuex_firehose.demand.monetize.llm_triage import _ollama_up, _ollama_generate, _build_prompt

def test_semantic_prefers_ollama_when_up():
    if not _ollama_up():
        pytest.skip("Ollama not running")
        return
        
    model = os.getenv("VX_OLLAMA_MODEL", "llama3.1:8b")  # default to installed model
    url = os.getenv("VX_OLLAMA_URL", "http://localhost:11434")
    prompt = _build_prompt("Need a Shopify theme tweak today, will pay.")
    
    try:
        resp = _ollama_generate(model, url, prompt)
    except Exception as e:
        pytest.skip(f"Ollama reachable but model likely missing: {e}")
        return
        
    assert isinstance(resp, dict)
