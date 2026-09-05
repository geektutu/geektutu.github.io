#!/bin/bash
set -eou pipefail

# 拉取各书籍源仓库到 posts/，内容由 scripts/import-content.mjs
# 按约定自动导入 src/content（中英双语路由），仓库无需登记配置。

root=$(cd $(dirname $0); pwd)

pull() {
    name="$1"
    dest="posts/$name"
    echo "update $dest"
    if [ -d "$dest" ]; then
        git -C "$dest" pull
    else
        git clone "git@github.com:geektutu/$name.git" "$dest"
    fi;
}

cd $root
pull 7days-golang
pull interview-questions
pull high-performance-go
pull 7days-geekagent