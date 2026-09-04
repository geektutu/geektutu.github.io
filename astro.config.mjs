// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import remarkDirective from 'remark-directive';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkCallout from './src/plugins/remark-callout.mjs';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 扫描文章 frontmatter 的 updated/date，供 sitemap 生成 lastmod。
 * 仅用正则解析日期字段，避免依赖 YAML 解析器。
 */
function collectPostDates() {
  const map = new Map();
  const dir = fileURLToPath(new URL('./src/content/posts', import.meta.url));
  if (!existsSync(dir)) return map;
  /** @param {string} d */
  const walk = (d) => {
    for (const name of readdirSync(d)) {
      const full = join(d, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (name.endsWith('.md')) {
        const fm = readFileSync(full, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
        const date = fm.match(/^updated:\s*(\S+)/m)?.[1] ?? fm.match(/^date:\s*(\S+)/m)?.[1];
        if (date) map.set(name.replace(/\.md$/, ''), date);
      }
    }
  };
  walk(dir);
  return map;
}
const postDates = collectPostDates();

// https://astro.build/config
export default defineConfig({
    site: 'https://geektutu.com',
    trailingSlash: 'ignore',
    vite: {
        plugins: [tailwindcss()],
    },
    integrations: [
        sitemap({
            // noindex 页面不进 sitemap
            filter: (page) => !page.includes('/search') && !page.includes('/tags/'),
            // 文章页：还原为真实部署的 /post/*.html（去尾斜杠），并用 frontmatter 的
            // updated（回退 date）作为 lastmod
            serialize(item) {
                const m = item.url.match(/\/post\/([^/]+)\.html\/?$/);
                if (m) {
                    item.url = item.url.replace(/\/$/, '');
                    if (postDates.has(m[1])) item.lastmod = postDates.get(m[1]);
                }
                return item;
            },
        }),
    ],
    image: {
        // 响应式图片：为 Markdown 图片生成多宽度 srcset，移动端只下载合适尺寸
        layout: 'constrained',
    },
    markdown: {
        remarkPlugins: [remarkDirective, remarkCallout, remarkMath],
        rehypePlugins: [rehypeKatex],
        shikiConfig: {
            theme: 'github-light',
            wrap: true,
        },
    },
});
