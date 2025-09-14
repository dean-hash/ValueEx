"""
Tests for Ollama-based language model triage functionality.
"""
from valuex_firehose.demand.monetize.llm_triage import _ollama_up, _parse_jsonish
import os

def test_parse_jsonish_survives_llm_noise():
    """Test that parse_jsonish can handle LLM output with noise."""
    # Test with extra whitespace and newlines
    s = '  {"route":"web","topics":["wordpress"],"angle":"hire","justification":"x"}  '
    out = _parse_jsonish(s)
    assert isinstance(out, dict)
    assert "route" in out
    assert out["route"] in {"web", "infra", "dev", "unknown"}
    
    # Test with extra text around the JSON
    s = 'Here is the JSON: ' + s + ' -- end of response'
    out = _parse_jsonish(s)
    assert isinstance(out, dict)
    assert "route" in out
    assert out["route"] in {"web", "infra", "dev", "unknown"}

def test_ollama_probe_boolean():
    """Test that the Ollama probe returns a boolean."""
    # Test shouldn't require an Ollama daemon; just assert boolean type
    assert isinstance(_ollama_up(), bool)
