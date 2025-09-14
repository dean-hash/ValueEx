import sys, yaml, subprocess, pathlib

# Load scope configuration
scope = yaml.safe_load(pathlib.Path("SCOPE.yaml").read_text())

# Get changed files in the staging area
changed = subprocess.check_output(["git", "diff", "--cached", "--name-only"]).decode().splitlines()

# Helper function to check if a file matches any pattern
def match(pats, f):
    from fnmatch import fnmatch
    return any(fnmatch(f, pat) for pat in pats)

# Check each changed file
for f in changed:
    f = f.replace('\\', '/')  # Normalize path separators
    
    # Check if file is explicitly denied
    if 'deny' in scope and match(scope['deny'], f):
        print(f"ERROR: Changes to '{f}' are not allowed (denied by SCOPE.yaml)")
        sys.exit(1)
    
    # If allowed paths are specified, check if file matches any of them
    if 'allow' in scope and not match(scope['allow'], f):
        print(f"ERROR: Changes to '{f}' are outside allowed directories (see SCOPE.yaml)")
        print("Allowed paths:")
        for p in scope['allow']:
            print(f"  - {p}")
        sys.exit(1)

# All checks passed
sys.exit(0)
