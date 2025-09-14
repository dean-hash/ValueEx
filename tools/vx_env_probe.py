from __future__ import annotations
import os, json, sys, time, socket
from pathlib import Path
try:
    import httpx  # if missing, run: pip install httpx
except Exception:
    print("Install httpx: valuex-firehose\\.venv2\\Scripts\\python.exe -m pip install httpx")
    sys.exit(1)

ROOT = Path(__file__).resolve().parents[1]
NEXT = ROOT / "VX_NEXT.md"
LOCK = ROOT / "audit" / "CONTEXT_LOCK.md"
OLLAMA_URL = os.getenv("VX_OLLAMA_URL", "http://localhost:11434")

def ping(url:str) -> dict:
    try:
        r = httpx.get(url + "/api/tags", timeout=5)
        r.raise_for_status()
        tags = r.json().get("models", [])
        return {"ok": True, "models": [t.get("name") for t in tags]}
    except Exception as e:
        return {"ok": False, "err": str(e)}

def small_append_status(ollama:dict):
    head = os.popen("git rev-parse --short HEAD").read().strip()
    lines = []
    lines.append("# Agent Resume Block")
    lines.append(f"- **Head:** `{head}`")
    lines.append(f"- **When:** {time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}")
    if ollama["ok"]:
        lines.append(f"- **Ollama:** UP at {OLLAMA_URL}")
        lines.append(f"- **Models:** {', '.join(ollama['models']) or '(none)'}")
        lines.append("- **Instruction:** Prefer Ollama for semantic triage. Fall back to OpenAI only if Ollama unavailable.")
    else:
        lines.append(f"- **Ollama:** DOWN ({ollama.get('err','')})")
        lines.append("- **Instruction:** Use static/keyword path + OpenAI fallback only if needed.")
    NEXT.write_text("\n".join(lines) + "\n")

    if LOCK.exists():
        txt = LOCK.read_text().splitlines()
        out = []
        had = {"head": False, "ollama": False}
        for ln in txt:
            if ln.strip().startswith("- git HEAD:"):
                ln = f"- git HEAD:  {head}"; had["head"]=True
            if ln.strip().startswith("- ollama:"):
                ln = f"- ollama:    {'UP' if ollama['ok'] else 'DOWN'}"; had["ollama"]=True
            out.append(ln)
        if not had["ollama"]:
            out.insert(2, f"- ollama:    {'UP' if ollama['ok'] else 'DOWN'}")
        LOCK.write_text("\n".join(out))

if __name__ == "__main__":
    o = ping(OLLAMA_URL)
    print(json.dumps(o, indent=2))
    small_append_status(o)
