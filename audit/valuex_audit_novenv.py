#!/usr/bin/env python3
# read-only repo audit for ValueX (no-git mode)
# Writes reports to ./audit/; does NOT modify or import your app.

import os, re, sys, json, hashlib, time, ast
from collections import defaultdict, Counter
from pathlib import Path

ROOT = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(".")
OUT  = Path("audit"); OUT.mkdir(exist_ok=True)

IGNORE_DIRS = {".venv2", ".git","node_modules","venv",".venv","dist","build","__pycache__",".mypy_cache",".pytest_cache",".idea",".vscode"}
CODE_EXT = {".py",".ts",".tsx",".js",".jsx",".json",".yaml",".yml",".toml",".ini",".md",".sql",".sh",".bat",".ps1",".dockerfile"}
MAX_HASH_BYTES = 2 * 1024 * 1024

def walk_files():
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in IGNORE_DIRS and not d.startswith(".DS_")]
        for f in filenames:
            p = Path(dirpath) / f
            if p.is_symlink(): continue
            if p.suffix.lower() in CODE_EXT or p.name.lower() == "dockerfile":
                yield p

def sha256_path(p: Path):
    try:
        size = p.stat().st_size
        h = hashlib.sha256()
        with p.open("rb") as fh:
            if size <= MAX_HASH_BYTES:
                h.update(fh.read())
            else:
                head = fh.read(512*1024)
                fh.seek(max(0, size - 512*1024))
                tail = fh.read()
                h.update(head); h.update(b"@"); h.update(tail)
        return h.hexdigest(), size
    except Exception:
        return None, None

IMPORT_RE_JS = re.compile(r"(?:import\s+(?:.+?\s+from\s+)?['\"]([^'\"]+)['\"]|require\(\s*['\"]([^'\"]+)['\"]\s*\))")
ENTRY_HINTS = [re.compile(r"if\s+__name__\s*==\s*['\"]__main__['\"]"), re.compile(r"\buvicorn\.run\b"), re.compile(r"\bapp\s*=\s*FastAPI\(", re.I), re.compile(r"\bexpress\(\)", re.I)]
TOKENS = {
    "fastapi": re.compile(r"\bFastAPI\b|\bfrom\s+fastapi\s+import\b"),
    "flask": re.compile(r"\bfrom\s+flask\s+import\b|\bFlask\("),
    "express": re.compile(r"require\(['\"]express['\"]\)|from\s+['\"]express['\"]"),
    "playwright": re.compile(r"\bplaywright\b", re.I),
    "crawl4ai": re.compile(r"\bcrawl4ai\b", re.I),
    "puppeteer": re.compile(r"\bpuppeteer\b", re.I),
    "cheerio": re.compile(r"\bcheerio\b", re.I),
    "sqlite": re.compile(r"\bsqlite3\b|\bsqlalchemy\b", re.I),
    "postgres": re.compile(r"\bpsycopg2?\b|\basyncpg\b", re.I),
    "mongo": re.compile(r"\bmongo(?:db)?\b|\bmongoose\b", re.I),
    "uvicorn": re.compile(r"\buvicorn\.run\b"),
    "express_listen": re.compile(r"\.listen\("),
}

def parse_js_imports(text):
    mods = []
    for m in IMPORT_RE_JS.finditer(text):
        grp = m.group(1) or m.group(2)
        if grp: mods.append(grp)
    return mods

def parse_py_imports(p: Path, text: str):
    mods = []
    try:
        tree = ast.parse(text or "", filename=str(p))
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for n in node.names:
                    mods.append(n.name.split(".")[0])
            elif isinstance(node, ast.ImportFrom) and node.module:
                mods.append(node.module.split(".")[0])
    except Exception:
        pass
    return mods

def detect_tokens(text):
    hits = {k: bool(rx.search(text)) for k, rx in TOKENS.items()}
    return {k: v for k, v in hits.items() if v}

def is_entry(text):
    return any(rx.search(text) for rx in ENTRY_HINTS)

def language_of(p: Path):
    ext = p.suffix.lower()
    if ext == ".py": return "python"
    if ext in {".ts",".tsx"}: return "typescript"
    if ext in {".js",".jsx"}: return "javascript"
    if ext in {".yaml",".yml"}: return "yaml"
    if ext in {".toml"}: return "toml"
    if ext in {".sql"}: return "sql"
    if ext in {".md"}: return "markdown"
    return ext.strip(".") or "other"

def read_text(p: Path):
    try:
        return p.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return ""

def main():
    files = []
    dup_map = defaultdict(list)
    imports_py = defaultdict(list)
    imports_js = defaultdict(list)
    token_hits = defaultdict(list)
    entries = []
    todos = []
    db_flags = set(); crawler_flags = set(); frameworks = set()

    for p in walk_files():
        rel = str(p.relative_to(ROOT))
        text = read_text(p)
        h, size = sha256_path(p)
        if h: dup_map[h].append(rel)
        lang = language_of(p)

        if p.suffix.lower()==".py":
            imports_py[rel] = parse_py_imports(p, text)
        elif p.suffix.lower() in (".ts",".tsx",".js",".jsx"):
            imports_js[rel] = parse_js_imports(text)

        hits = detect_tokens(text)
        if hits:
            token_hits[rel] = sorted(hits.keys())
            for k in hits:
                if k in ("fastapi","flask","express"): frameworks.add(k)
                if k in ("playwright","crawl4ai","puppeteer","cheerio"): crawler_flags.add(k)
                if k in ("sqlite","postgres","mongo"): db_flags.add(k)

        if is_entry(text): entries.append(rel)

        if "TODO" in text or "FIXME" in text:
            for i, line in enumerate(text.splitlines()[:2000], 1):
                if "TODO" in line or "FIXME" in line:
                    todos.append({"file": rel, "line": i, "text": line.strip()})

        files.append({"path": rel, "size": size or 0, "mtime": int(p.stat().st_mtime), "lang": lang, "hash": h or ""})

    stems = {Path(f["path"]).stem: f["path"] for f in files}
    from collections import Counter
    inbound = Counter()
    def bump_inbound(graph):
        for f, mods in graph.items():
            for m in mods:
                stem = (m.split("/")[0].split("\\")[0].split(".")[0])
                if stem in stems: inbound[stems[stem]] += 1

    bump_inbound(imports_py); bump_inbound(imports_js)

    orphans = [f["path"] for f in files
               if f["path"] not in entries
               and f["path"] in stems.values()
               and f["lang"] in {"python","javascript","typescript"}
               and inbound[f["path"]] == 0]

    duplicates = [paths for h, paths in dup_map.items() if len(paths) > 1]

    components = defaultdict(list)
    COMPONENT_KEYS = {
        "ingest": ("ingest","crawler","scrape","collector"),
        "api": ("api","server","fastapi","flask","express"),
        "scoring": ("score","rank","classify","model"),
        "router": ("router","route","match","offer"),
        "ui": ("ui","frontend","pages","components"),
        "data": ("db","data","schema","sqlite","sql","migration"),
        "ops": ("docker","compose","deploy","ci","taskfile","makefile"),
        "tests": ("test","tests","__tests__")
    }
    for f in files:
        path_lower = f["path"].lower()
        for comp, toks in COMPONENT_KEYS.items():
            if any(tok in path_lower for tok in toks):
                components[comp].append(f["path"])

    now = int(time.time())
    Path(OUT/"manifest.json").write_text(json.dumps({"generated_at": now, "root": str(ROOT.resolve()), "files": files}, indent=2))
    Path(OUT/"deps_python.json").write_text(json.dumps(imports_py, indent=2))
    Path(OUT/"deps_js.json").write_text(json.dumps(imports_js, indent=2))
    Path(OUT/"token_hits.json").write_text(json.dumps(token_hits, indent=2))
    Path(OUT/"components.json").write_text(json.dumps(components, indent=2))
    Path(OUT/"orphans.txt").write_text("\n".join(sorted(orphans)))
    if duplicates: Path(OUT/"duplicates.json").write_text(json.dumps(duplicates, indent=2))
    if todos: Path(OUT/"todos.json").write_text(json.dumps(todos, indent=2))

    def short_list(items, limit=15):
        items = list(items)
        if not items: return "- (none)\n"
        out = "".join(f"- {i}\n" for i in items[:limit])
        if len(items) > limit: out += f"- … (+{len(items)-limit} more)\n"
        return out

    summary = []
    summary.append(f"# ValueX Codebase Snapshot (No-Git)\n\nGenerated: {time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(now))}\nRoot: `{Path(ROOT).resolve()}`\n")
    from collections import Counter as C
    lang_counts = C([f['lang'] for f in files])
    summary.append("## Stats\n" + "".join(f"  - {k}: {v}\n" for k,v in lang_counts.most_common()))
    summary.append(f"- Files scanned: **{len(files)}**\n")
    summary.append("\n## Likely entrypoints\n" + short_list(entries))
    fw = sorted(set(k for v in token_hits.values() for k in v if k in ("fastapi","flask","express")))
    cr = sorted(set(k for v in token_hits.values() for k in v if k in ("playwright","crawl4ai","puppeteer","cheerio")))
    db = sorted(set(k for v in token_hits.values() for k in v if k in ("sqlite","postgres","mongo")))
    summary.append("## Frameworks detected\n" + short_list(fw))
    summary.append("## Crawling libs detected\n" + short_list(cr))
    summary.append("## DB libs detected\n" + short_list(db))
    summary.append("## Orphan candidate files (no inbound references)\n" + short_list(sorted(orphans)))
    if duplicates:
        summary.append("## Duplicate files (hash-matches)\n" + short_list([", ".join(x) for x in duplicates], limit=10))
    if todos:
        summary.append("## TODO / FIXME (first 15)\n" + short_list([f"{t['file']}:{t['line']} — {t['text']}" for t in todos], limit=15))
    summary.append("## Components (heuristic)\n")
    for comp, lst in components.items():
        summary.append(f"### {comp}\n" + short_list(sorted(lst), limit=12))
    summary.append("\n## What to do next (thin slice)\n1. Confirm one entrypoint to run.\n2. Choose one path ingest → score → route already present.\n3. Quarantine orphans/dups not needed for that path.\n4. Define a thin-slice test and ship.\n")
    Path(OUT/"_summary.md").write_text("\n".join(summary), encoding="utf-8")
    print("[audit] Wrote:", OUT/"_summary.md")

if __name__ == "__main__":
    main()
