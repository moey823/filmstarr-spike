"""Export the validated site tree to gh-pages without changing the checkout."""
from pathlib import Path
import subprocess
import sys
root = Path(__file__).resolve().parents[1]
def git(*args, check=True):
    return subprocess.run(["/usr/bin/git", *args], cwd=root, text=True, capture_output=True, check=check)
subprocess.run([sys.executable, str(root / "scripts/check.py")], check=True)
if git("status", "--porcelain", "--", "site").stdout.strip():
    raise SystemExit("Commit site changes before exporting")
tree = git("rev-parse", "HEAD:site").stdout.strip()
previous = git("rev-parse", "--verify", "refs/heads/gh-pages", check=False)
parent = previous.stdout.strip() if previous.returncode == 0 else None
if parent and git("rev-parse", parent + "^{tree}").stdout.strip() == tree:
    print("Site tree already exported: " + parent)
else:
    args = ["commit-tree", tree, "-m", "Publish filmstarr portfolio spike"]
    if parent:
        args += ["-p", parent]
    commit = git(*args).stdout.strip()
    git("update-ref", "refs/heads/gh-pages", commit, parent or "0" * 40)
    print("Exported site-only branch: " + commit)
