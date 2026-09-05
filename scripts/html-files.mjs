/**
 * 将 Astro 生成的 post 动态路由目录 /post/<slug>.html/（含英文版
 * /en/post/<slug>.html/）转换为真正的静态 .html 文件，
 * 兼容原博客 URL，且让 Pagefind 能正确索引。
 */
import { existsSync, readdirSync, renameSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

let converted = 0;
for (const base of ['dist/post', 'dist/en/post']) {
  const POST_DIR = join(ROOT, base);
  if (!existsSync(POST_DIR)) continue;

  for (const name of readdirSync(POST_DIR)) {
    const dir = join(POST_DIR, name);
    if (name.endsWith('.html') && statSync(dir).isDirectory()) {
      const src = join(dir, 'index.html');
      if (existsSync(src)) {
        const tmp = join(POST_DIR, `${name}.tmp`);
        renameSync(src, tmp);
        rmSync(dir, { recursive: true, force: true });
        renameSync(tmp, dir); // 现在 dir 是一个文件
        converted++;
      }
    }
  }
}

console.log(`✔ 已将 ${converted} 篇文章目录转换为 /post/*.html（含 /en/post/*.html）文件。`);
