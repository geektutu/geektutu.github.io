/**
 * 构建期校验：
 *  1. 串章错误：文章声明了 book，但其 slug 不在该书的 outline 中
 *  2. 漏章警告：书 outline 声明了章节 slug，但未找到对应文章
 *  3. 死链检查：dist 中的内部链接 / 图片是否都能解析到真实文件
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const BOOKS_DIR = join(ROOT, 'src/content/books');
const POSTS_DIR = join(ROOT, 'src/content/posts');
const DIST = join(ROOT, 'dist');

function readFrontmatter(file) {
  const content = readFileSync(file, 'utf8');
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  try {
    return YAML.parse(m[1]) ?? {};
  } catch (e) {
    console.warn(`  [警告] frontmatter 解析失败: ${file}`);
    return {};
  }
}

function listMarkdown(dir) {
  if (!existsSync(dir)) return [];
  // 按书分子目录：<bookDir>/<slug>.md 与图片目录 <bookDir>/<slug>/ 同级
  const out = [];
  const walk = (d) => {
    for (const name of readdirSync(d)) {
      const full = join(d, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (extname(name) === '.md') out.push(full);
    }
  };
  walk(dir);
  return out;
}

const errors = [];
const warnings = [];

// 收集书与大纲
const bookChapters = new Map(); // bookId -> [slug]
for (const f of readdirSync(BOOKS_DIR).filter((x) => extname(x) === '.md')) {
  const fm = readFrontmatter(join(BOOKS_DIR, f));
  const id = fm.id ?? f.replace(/\.md$/, '');
  const slugs = [];
  for (const group of fm.outline ?? []) {
    for (const s of group.chapters ?? []) slugs.push(s);
  }
  bookChapters.set(id, slugs);
}

// 收集文章（id 只取文件名，与子目录无关）
const postInfo = new Map(); // slug -> {book}
for (const f of listMarkdown(POSTS_DIR)) {
  const slug = basename(f, '.md');
  const fm = readFrontmatter(f);
  postInfo.set(slug, { book: fm.book });
}

// 串章检查
for (const [slug, info] of postInfo) {
  if (info.book) {
    const slugs = bookChapters.get(info.book) ?? [];
    if (!slugs.includes(slug)) {
      errors.push(`串章：文章 "${slug}" 声明属于书 "${info.book}"，但该书 outline 中不包含它`);
    }
  }
}

// 漏章检查（警告）
for (const [bookId, slugs] of bookChapters) {
  for (const slug of slugs) {
    if (!postInfo.has(slug)) {
      warnings.push(`漏章：书 "${bookId}" 的 outline 声明了 "${slug}"，但未找到对应文章`);
    }
  }
}

// 死链检查（dist）
const DIST_IGNORE = ['/pagefind/', '/favicon', '/_astro/'];
function collectInternalLinks(file) {
  const html = readFileSync(file, 'utf8');
  const links = new Set();
  const re = /(?:href|src)\s*=\s*"([^"]*)"/g;
  let m;
  while ((m = re.exec(html))) {
    const url = m[1];
    if (url.startsWith('/') && !url.startsWith('//')) links.add(url.split('#')[0].split('?')[0]);
  }
  return links;
}

function resolveDist(url) {
  if (url === '/') return join(DIST, 'index.html');
  if (url.endsWith('/')) return join(DIST, url, 'index.html');
  if (extname(url)) return join(DIST, url);
  return join(DIST, url, 'index.html');
}

let brokenLinks = 0;
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      walk(full);
    } else if (name.endsWith('.html')) {
      for (const url of collectInternalLinks(full)) {
        if (DIST_IGNORE.some((p) => url.startsWith(p))) continue;
        const target = resolveDist(url);
        if (!existsSync(target)) {
          brokenLinks++;
          errors.push(`死链：${full.replace(DIST, 'dist')} → "${url}"（${target.replace(DIST, 'dist')} 不存在）`);
        }
      }
    }
  }
}
if (existsSync(DIST)) walk(DIST);

// 输出
if (warnings.length) {
  console.log('\n⚠ 警告：');
  warnings.forEach((w) => console.log('  ' + w));
}
if (errors.length) {
  console.error('\n✖ 校验失败：');
  errors.forEach((e) => console.error('  ' + e));
  console.error(`\n共 ${errors.length} 个错误，${warnings.length} 个警告。`);
  process.exit(1);
} else {
  console.log(`\n✔ 校验通过：无错误，${warnings.length} 个警告。`);
}
