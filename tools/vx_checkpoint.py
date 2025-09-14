from __future__ import annotations
import argparse, json, os, subprocess, sys, time
from datetime import datetime
from pathlib import Path
import fnmatch

ROOT = Path(__file__).resolve().parents[1]
VX = ROOT/".vx"; VX.mkdir(parents=True, exist_ok=True)
LEDGER = VX/"ledger.json"
NEXT_MD = ROOT/"VX_NEXT.md"

def sh(args:list[str], check=True) -> subprocess.CompletedProcess:
    return subprocess.run(args, cwd=ROOT, text=True, capture_output=True, check=check)

def last_tag() -> str|None:
    out = sh(["git","for-each-ref","--sort=-creatordate","--format=%(refname:short)","refs/tags/vx-ckpt-*"], check=False).stdout.strip()
    return out.splitlines()[0] if out else None

def head() -> str:
    p = sh(["git","rev-parse","--short","HEAD"], check=False)
    return (p.stdout or "?").strip()

def changed_since(tag:str|None) -> list[str]:
    if tag:
        out = sh(["git","diff","--name-only",f"{tag}...HEAD"], check=False).stdout
    else:
        out = sh(["git","ls-files"], check=False).stdout
    return [l.strip().replace("\\","/") for l in out.splitlines() if l.strip()]

def run_suite() -> dict:
    py = str(ROOT/"valuex-firehose/.venv2/Scripts/python.exe")
    if not Path(py).exists(): py = "python"
    res = {}
    def run(label, cmd):
        p = subprocess.run(cmd, cwd=ROOT, text=True, capture_output=True)
        res[label] = {"ok": p.returncode==0, "out": (p.stdout+p.stderr)[-2000:]}
    run("pytest", [py,"-m","pytest","-q"])
    vf = ROOT/"valuex-firehose/scripts/verify_fiverr_links.py"
    if vf.exists(): run("verify_fiverr_links",[py,str(vf)])
    ln = ROOT/"tools/lint_no_afp_outside_builder.py"
    if ln.exists(): run("lint_no_afp_outside_builder",[py,str(ln)])
    res["overall_ok"] = all(v["ok"] for v in res.values() if isinstance(v,dict) and "ok" in v)
    return res

def write_next(tag:str, suite:dict, notes:str|None):
    lines = [
        "# Agent Resume Block",
        f"- **Resume from tag:** `{tag}`",
        f"- **Head:** `{head()}`",
        f"- **When:** {datetime.utcnow().isoformat()}Z",
        f"- **Overall checks:** {'PASS' if suite['overall_ok'] else 'FAIL'}",
        "",
        "## Next Actions",
        (notes or "None").strip(),
        "",
        "## Contract",
        "- Work only inside SCOPE.yaml → allow.",
        "- Do not change thresholds without adding/adjusting a test.",
        "- Use the linker/builder for affiliate URLs.",
        "- Before edits, run tests; if failing, propose the minimal fix with a test.",
        ""
    ]
    NEXT_MD.write_text("\n".join(lines), encoding="utf-8")

def append_ledger(entry:dict):
    data = []
    if LEDGER.exists():
        try: data = json.loads(LEDGER.read_text())
        except: data = []
    data.append(entry)
    LEDGER.write_text(json.dumps(data, indent=2), encoding="utf-8")

def create_tag(label:str|None) -> str:
    ts = time.strftime("%Y%m%d-%H%M%S", time.gmtime())
    tag = f"vx-ckpt-{ts}-{head()}"
    msg = f"VX checkpoint {ts}" + (f" label={label}" if label else "")
    sh(["git","tag","-a",tag,"-m",msg], check=False)
    return tag

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--checkpoint", action="store_true")
    ap.add_argument("--guard", action="store_true")
    ap.add_argument("--label", type=str, default=None)
    ap.add_argument("--next", dest="next_text", type=str, default=None)
    args = ap.parse_args()

    if args.guard:
        tag = last_tag()
        changed = changed_since(tag)
        # Guard only if there were changes since last tag
        if not changed:
            print("vx-guard: no changes since last checkpoint; OK")
            sys.exit(0)
        suite = run_suite()
        print(f"vx-guard: overall_ok={suite['overall_ok']}")
        if not suite["overall_ok"]:
            for k,v in suite.items():
                if isinstance(v,dict) and not v.get("ok",True):
                    print(f"[{k} FAILED]\n{v.get('out','')}")
            sys.exit(1)
        sys.exit(0)

    if args.checkpoint:
        suite = run_suite()
        tag = create_tag(args.label)
        entry = {
            "ts": datetime.utcnow().isoformat()+"Z",
            "tag": tag,
            "head": head(),
            "label": args.label,
            "overall_ok": suite["overall_ok"],
        }
        append_ledger(entry)
        write_next(tag, suite, args.next_text)
        print(f"[OK] checkpoint {tag}  overall_ok={suite['overall_ok']}")
        sys.exit(0)

    ap.print_help()

if __name__ == "__main__":
    main()
