/**
 * 构建期清理：Astro 将 Markdown 图片转为 webp 后，dist/_astro 中会残留
 * 未被任何页面引用的 jpg/png/gif 原图。本脚本扫描 dist 下的 HTML/XML/CSS/JS
 * 引用，删除无引用的原图，减小部署体积。运行于 npm run build 的 pagefind 之前。
 */
import { readFileSync, readdirSync, rmSync, statSync, existsSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIST = join(ROOT, 'dist');
const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif']);

function collectFiles(dir, exts) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const stat = statSync(p);
    if (stat.isDirectory()) out.push(...collectFiles(p, exts));
    else if (exts.has(extname(name))) out.push(p);
  }
  return out;
}

const assetsDir = join(DIST, '_astro');
if (!existsSync(assetsDir)) {
  console.log('prune-images: dist/_astro 不存在，跳过');
  process.exit(0);
}

const originals = readdirSync(assetsDir).filter((f) => IMAGE_EXTS.has(extname(f)));
if (originals.length === 0) {
  console.log('prune-images: 无残留原图');
  process.exit(0);
}

const referenceable = new Set(['.html', '.xml', '.css', '.js']);
const pages = collectFiles(DIST, new Set([...referenceable, '.pf_fragment', '.pf_meta']));
let haystack = '';
for (const p of pages) {
  if (referenceable.has(extname(p))) haystack += readFileSync(p, 'utf8');
  else haystack += readFileSync(p).toString('latin1');
}

let removed = 0;
let savedBytes = 0;
for (const f of originals) {
  if (!haystack.includes(f)) {
    savedBytes += statSync(join(assetsDir, f)).size;
    rmSync(join(assetsDir, f));
    removed++;
  }
}
console.log(`prune-images: 删除 ${removed} 个未引用原图，释放 ${(savedBytes / 1024 / 1024).toFixed(2)}MB`);
