#!/bin/bash
set -eou pipefail

root=$(cd $(dirname $0); pwd)
cd $root

npm run build

git worktree prune

# Remove any stale worktree that was left behind (e.g. by a previously
# interrupted run) which would otherwise pin the gh-pages branch.
if git show-ref --verify --quiet refs/heads/gh-pages; then
    git worktree list --porcelain | awk -v branch="refs/heads/gh-pages" '
        /^worktree / { wt=$2; next }
        /^branch / { if ($2 == branch) { print wt } }
    ' | while read -r wt; do
        if [ -n "$wt" ] && [ -d "$wt" ]; then
            git worktree remove --force "$wt"
        fi
    done
    git worktree prune
    git branch -D gh-pages
fi

tmp=$(mktemp -d)
# Ensure we clean up even if the deploy fails midway.
trap 'git worktree remove --force "$tmp" 2>/dev/null || true; rm -rf "$tmp"' EXIT

if git show-ref --verify --quiet refs/remotes/origin/gh-pages; then
    git worktree add -B gh-pages "$tmp" origin/gh-pages
else
    git worktree add -B gh-pages "$tmp"
fi

git -C "$tmp" rm -rf --quiet .
cp -R dist/. "$tmp"/
git -C "$tmp" add -A
git -C "$tmp" commit -m "Deploy site to gh-pages" --quiet
git -C "$tmp" push origin gh-pages
