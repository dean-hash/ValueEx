from __future__ import annotations

import json
import os
import time
from typing import Any, Dict, Optional

import httpx


def _build_prompt(text: str) -> str:
    return (
        "You are a concise triage assistant. Given a user post, decide if it's a monetizable demand signal "
        "for web/infra/dev help. Return STRICT JSON only with keys: "
        "route (bool), topics (list[str]), angle (str), justification (str).\n\n"
        f"Input:\n{text}\n\nJSON:"
    )


def _parse_jsonish(s: str) -> Dict[str, Any]:
    try:
        return json.loads(s)
    except Exception:
        i = s.find("{")
        j = s.rfind("}")
        if i >= 0 and j > i:
            frag = s[i : j + 1]
            try:
                return json.loads(frag)
            except Exception:
                pass
    return {"raw": s.strip()[:2000]}


def _ollama_up(url: Optional[str] = None) -> bool:
    """Check if Ollama API is available."""
    if not httpx:
        return False
    
    url = (url or os.getenv("VX_OLLAMA_URL", "http://localhost:11434")).rstrip("/")
    try:
        r = httpx.get(f"{url}/api/tags", timeout=3)
        return r.status_code == 200
    except Exception:
        return False

def _ollama_generate(model: str, url: str, prompt: str) -> Dict[str, Any]:
    """
    Generate a response using Ollama's API with fallback to chat API.
    Returns dict or {"raw": str} on error.
    """
    if not httpx:
        return {"raw_error": "httpx not available for Ollama integration"}

    # Try /api/generate first
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": {"temperature": 0.2, "num_predict": 200},
    }
    
    try:
        with httpx.Client(timeout=45) as client:
            # First try /api/generate
            try:
                r = client.post(f"{url}/api/generate", json=payload)
                if r.status_code in (404, 405):
                    raise httpx.HTTPStatusError("Trying chat fallback", request=r.request, response=r)
                r.raise_for_status()
                data = r.json()
                resp = (data.get("response") or "").strip()
                
                # Try to parse the response
                parsed = _parse_jsonish(resp)
                if isinstance(parsed, dict):
                    return {
                        "provider": "ollama",
                        "model": data.get("model", model),
                        "ok": True,
                        "result": {
                            "route": bool(parsed.get("route", True)),
                            "topics": parsed.get("topics", []),
                            "angle": parsed.get("angle", ""),
                            "justification": parsed.get("justification", ""),
                        },
                        "raw": resp,
                    }
                return {"raw": resp}
                
            except (httpx.HTTPStatusError, json.JSONDecodeError):
                # Fall back to /api/chat
                chat_payload = {
                    "model": model,
                    "messages": [{"role": "user", "content": prompt}],
                    "stream": False,
                    "options": {"temperature": 0.2, "num_predict": 200},
                }
                r = client.post(f"{url}/api/chat", json=chat_payload)
                r.raise_for_status()
                data = r.json()
                resp = data.get("message", {}).get("content", "").strip()
                
                # Try to parse the response
                parsed = _parse_jsonish(resp)
                if isinstance(parsed, dict):
                    return {
                        "provider": "ollama-chat",
                        "model": data.get("model", model),
                        "ok": True,
                        "result": {
                            "route": bool(parsed.get("route", True)),
                            "topics": parsed.get("topics", []),
                            "angle": parsed.get("angle", ""),
                            "justification": parsed.get("justification", ""),
                        },
                        "raw": resp,
                    }
                return {"raw": resp}
                
    except Exception as e:
        # Return a dict with the error for graceful degradation
        return {
            "raw_error": f"Ollama API error: {str(e)}",
            "provider": "ollama",
            "model": model,
            "ok": False
        }

def _groq_chat(model: str, api_key: str, prompt: str) -> Dict[str, Any]:
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    messages = [
        {
            "role": "system",
            "content": (
                "You are a concise triage assistant. Respond with STRICT JSON only, no prose. Keys: "
                "route (bool), topics (list[str]), angle (str), justification (str)."
            ),
        },
        {"role": "user", "content": prompt},
    ]
    payload = {
        "model": model,
        "messages": messages,
        "temperature": 0.2,
        "max_tokens": 300,
    }
    with httpx.Client(timeout=30) as client:
        r = client.post(url, headers=headers, json=payload)
        r.raise_for_status()
        data = r.json()
    content = (
        (((data.get("choices") or [{}])[0] or {}).get("message") or {}).get("content") or ""
    ).strip()
    parsed = _parse_jsonish(content)
    res = parsed if isinstance(parsed, dict) else {"raw": str(parsed)}
    out_res = {
        "route": bool(res.get("route", True)) if isinstance(res, dict) else True,
        "topics": res.get("topics") if isinstance(res, dict) else [],
        "angle": res.get("angle") if isinstance(res, dict) else "",
        "justification": res.get("justification") if isinstance(res, dict) else "",
    }
    return {
        "provider": "groq",
        "model": data.get("model") or model,
        "ok": True,
        "result": out_res,
        "raw": content,
    }


def triage(text: str) -> Dict[str, Any]:
    """
    Run triage with automatic provider selection.
    Prefers Ollama if available, falls back to other configured providers.
    """
    # Try Ollama first if available
    ollama_url = os.getenv("VX_OLLAMA_URL", "http://localhost:11434").rstrip("/")
    ollama_model = os.getenv("VX_OLLAMA_MODEL", "llama3.1:8b")
    
    if _ollama_up(ollama_url):
        try:
            prompt = _build_prompt(text)
            result = _ollama_generate(ollama_model, ollama_url, prompt)
            
            # Handle the response format from _ollama_generate
            if isinstance(result, dict):
                if result.get("ok", False):
                    return result
                elif "raw" in result or "raw_error" in result:
                    # Handle raw responses or errors
                    return {
                        "provider": result.get("provider", "ollama"),
                        "model": result.get("model", ollama_model),
                        "ok": False,
                        "error": result.get("raw_error", "Failed to parse Ollama response"),
                        "result": {
                            "route": True,  # Default to route=true on error
                            "topics": [],
                            "angle": "",
                            "justification": result.get("raw", "Ollama response parsing failed")
                        },
                        "raw": result.get("raw", str(result))
                    }
        except Exception as e:
            print(f"Ollama triage failed: {e}")
    
    # Fall back to Groq if configured
    groq_api_key = os.getenv("GROQ_API_KEY")
    groq_model = os.getenv("GROQ_MODEL", "mixtral-8x7b-32768")
    
    if groq_api_key:
        try:
            prompt = _build_prompt(text)
            groq_result = _groq_chat(groq_model, groq_api_key, prompt)
            if isinstance(groq_result, dict):
                if groq_result.get("ok", False):
                    return groq_result
                elif "error" in groq_result:
                    print(f"Groq triage error: {groq_result['error']}")
        except Exception as e:
            print(f"Groq triage failed: {e}")
    
    # Fallback to a default response if all else fails
    return {
        "provider": "none",
        "model": "none",
        "ok": False,
        "error": "No available triage providers",
        "result": {
            "route": True,  # Default to route=true on error
            "topics": [],
            "angle": "",
            "justification": "No triage provider available"
        },
        "raw": ""
    }
