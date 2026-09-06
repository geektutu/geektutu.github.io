# 极客兔兔的博客

## 在线阅读

Coding 创建有趣的开源项目，戳：[https://geektutu.com/](https://geektutu.com/)

## 订阅我的博客

最新动态可以关注：知乎 [Go语言](https://www.zhihu.com/people/gzdaijie) 或微博 [极客兔兔](https://weibo.com/geektutu)

订阅方式：右上角 **watch** [geektutu/geektutu.github.io](https://github.com/geektutu/geektutu.github.io)，或通过 [RSS](https://geektutu.com/feed.xml) 订阅。

**较为完整的系列有：**

- AI
  - [七天从零实现 GeekAgent](https://geektutu.com/books/geekagent/)

- Go 语言
  - [七天用Go从零实现系列](https://geektutu.com/books/7days-golang/)
  - [Go 语言高性能编程](https://geektutu.com/books/high-performance-go/)
  - [极客面试](https://geektutu.com/books/interview-questions/)

- 经历与感悟
  - [历史博客](https://geektutu.com/books/history/)

## 关于 Astro 站点

本站基于 [Astro](https://astro.build) 构建，文章正文与站点代码分离，存放在各内容源仓库中。

```bash
npm install   # 安装依赖模块
npm run pull  # 拉取 posts/ 下各源仓库最新文章，并导入 src/content
npm run dev   # 本地预览，默认 localhost:4321
npm run build # 构建生产站点到 ./dist（含字体子集化、Pagefind 搜索索引等）
npm run pages # 构建 + 部署到 gh-pages 分支
```

`posts` 目录由 `pull.sh` 维护，克隆的是各内容源仓库（7days-golang、high-performance-go 等）。
每次执行 `npm run pull` 时，`scripts/import-content.mjs` 会按约定将仓库中的 markdown 与图片
拷贝到 `src/content`，无需登记配置：

- 书籍元数据 md（frontmatter 同时含 `id` 和 `outline`）→ `src/content/books/<id>.md`
- 正文 md（frontmatter 含 `book`，值为书籍 id）→ `src/content/posts/<book id>/`
- 语言路由：frontmatter `lang: en` 视为英文（`books-en` / `posts-en`），缺省视为中文

站点默认中文，英文页面位于 `/en/` 下，双语共用相同的 slug（`/post/x.html` ↔ `/en/post/x.html`）。
直接在 `src/content/posts` 下新建 `.md` 文件写独立文章也是没有问题的。

评论使用 [Gitalk](https://github.com/gitalk/gitalk)，以 issue 形式写入本仓库；
评论、赞赏码（支付宝 / 微信）与备案信息通过 `.env` 配置，参考 `.env.example`：

```bash
cp .env.example .env
```

## 部署

本站构建后托管在 [GitHub Pages](https://pages.github.com)，域名指向 geektutu.com。

`npm run pages` 会执行 `gh-pages.sh`：构建站点后，通过 `git worktree` 将 `dist/`
推送到 `gh-pages` 分支。
