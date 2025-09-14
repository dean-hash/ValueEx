from valuex_firehose.demand.monetize.llm_triage import _build_prompt, _parse_jsonish

def test_partial_term_shopif():
    # Test that we can handle partial terms (e.g., user typos or abbreviations)
    prompt = _build_prompt("shopif theme tweak asap")
    assert "shopif" in prompt.lower()
    
    # Simulate a response with partial term handling
    response = '{"route":"web","topics":["shopify"],"angle":"hire","justification":"partial ok"}'
    result = _parse_jsonish(response)
    
    # Check that the route is valid and the parser handled the response correctly
    assert result["route"] in {"web", "infra", "dev", "unknown"}
    assert "shopify" in result.get("topics", [])

def test_partial_term_webflw():
    # Test another common partial term
    prompt = _build_prompt("webflw designer for landing page")
    assert "webflw" in prompt.lower()
    
    # Simulate a response with partial term handling
    response = '{"route":"web","topics":["webflow"],"angle":"hire","justification":"partial ok"}'
    result = _parse_jsonish(response)
    
    # Basic validation of the response structure
    assert isinstance(result, dict)
    assert "route" in result
    assert "topics" in result
    assert isinstance(result["topics"], list)
    assert "angle" in result
