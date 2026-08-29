#!/bin/bash
set -eou pipefail

root=$(cd $(dirname $0); pwd)

pull() {
    repo="$1"
    dest="$2"
    echo "update $dest"
    if [ -d "$dest" ]; then
        git -C "$dest" pull
    else
        git clone "git@github.com:$repo.git" "$dest"
    fi;
}

cd $root
pull geektutu/7days-golang posts/7days-golang
pull geektutu/interview-questions posts/interview-questions
pull geektutu/high-performance-go posts/high-performance-go
# 按照 astro 新格式的仓库
pull geektutu/7days-geekagent posts/7days-geekagent
mkdir -p src/content/posts/geekagent
find posts/7days-geekagent -name "geekagent-*.md" | xargs -I{} cp {} src/content/posts/geekagent
find posts/7days-geekagent -name "geekagent.md" | xargs -I{} cp {} src/content/books