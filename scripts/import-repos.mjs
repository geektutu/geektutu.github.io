/**
 * 导入 posts/ 下的 3 个源仓库（pull.sh 拉取）为 3 本独立的书籍：
 *   7days-golang          → 七天用Go从零实现系列
 *   interview-questions   → 极客面试
 *   high-performance-go   → Go 语言高性能编程
 * （tensorflow2-docs-zh 已并入「历史博客」history 书，见 import-history.mjs）
 *
 * 与 import-history.mjs 相同的产物约定：
 *   src/content/posts/<bookDir>/<slug>.md        正文（frontmatter 重写）
 *   src/content/posts/<bookDir>/<slug>/          文章图片目录
 *   src/content/books/<bookId>.md                书籍元数据 + outline
 * markdown 中图片以相对路径引用：<slug>/xxx.png。
 *
 * 图片引用兼容三种写法：相对 md 目录（<slug>/x.jpg、./image/x.png）、
 * 相对仓库根（charpter-0/high-performance-go/x.jpg）、旧站路径（post/<slug>/x.jpg）。
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SRC = path.join(ROOT, 'posts');
const DEST = path.join(ROOT, 'src/content/posts');
const BOOK_DEST = path.join(ROOT, 'src/content/books');

/** 分部标题与顺序（order 小者在前），categories 未命中时兜底 */
const PART_DEFAULT = { title: '未分类', order: 99 };

const BOOKS = [
  {
    dir: '7days-golang',
    id: '7days-golang',
    title: '七天用Go从零实现系列',
    description: '7 天用 Go 从零实现 Web 框架、分布式缓存、ORM、RPC 框架，坚持用不到 1000 行代码实现一个框架，重视动手实践。',
    order: 10,
    featured: true,
    tags: ['Go'],
    // 书籍配套仓库，章节页头部以标签形式提示
    repo: 'https://github.com/geektutu/7days-golang',
    // 侧边栏等紧凑场景的章节短标题（key 为 slug）
    shortTitles: {
      gee: 'Day0 序言',
      'gee-day1': 'Day1 HTTP 基础',
      'gee-day2': 'Day2 上下文',
      'gee-day3': 'Day3 前缀树路由',
      'gee-day4': 'Day4 分组控制',
      'gee-day5': 'Day5 中间件',
      'gee-day6': 'Day6 模板 Template',
      'gee-day7': 'Day7 错误恢复',
      geecache: 'Day0 序言',
      'geecache-day1': 'Day1 LRU 缓存淘汰策略',
      'geecache-day2': 'Day2 单机并发缓存',
      'geecache-day3': 'Day3 HTTP 服务端',
      'geecache-day4': 'Day4 一致性哈希',
      'geecache-day5': 'Day5 分布式节点',
      'geecache-day6': 'Day6 防止缓存击穿',
      'geecache-day7': 'Day7 使用 Protobuf 通信',
      geeorm: 'Day0 序言',
      'geeorm-day1': 'Day1 database/sql 基础',
      'geeorm-day2': 'Day2 对象表结构映射',
      'geeorm-day3': 'Day3 记录新增和查询',
      'geeorm-day4': 'Day4 链式操作与更新删除',
      'geeorm-day5': 'Day5 实现钩子',
      'geeorm-day6': 'Day6 支持事务',
      'geeorm-day7': 'Day7 数据库迁移',
      geerpc: 'Day0 序言',
      'geerpc-day1': 'Day1 服务端与消息编码',
      'geerpc-day2': 'Day2 高性能客户端',
      'geerpc-day3': 'Day3 服务注册',
      'geerpc-day4': 'Day4 超时处理',
      'geerpc-day5': 'Day5 支持HTTP协议',
      'geerpc-day6': 'Day6 负载均衡',
      'geerpc-day7': 'Day7 服务发现与注册中心',
      '7days-golang-q1': '接口型函数',
    },
    parts: {
      'Web框架 - Gee': { title: 'Web 框架 Gee', order: 1 },
      '分布式缓存 - GeeCache': { title: '分布式缓存 GeeCache', order: 2 },
      'ORM框架 - GeeORM': { title: 'ORM 框架 GeeORM', order: 3 },
      'RPC框架 - GeeRPC': { title: 'RPC 框架 GeeRPC', order: 4 },
      '7days-golang Q & A': { title: 'Q & A', order: 5 },
    },
  },
  {
    dir: 'interview-questions',
    id: 'interview-questions',
    title: '极客面试',
    description: '机器学习与 Go 语言笔试面试题，包含基础语法、并发编程、GC 原理，以及机器学习/深度学习常见习题与工程实践题。',
    order: 40,
    featured: false,
    tags: ['面试'],
    repo: 'https://github.com/geektutu/interview-questions',
    // ml/N.md 无 frontmatter，改写为 qa-ml-qN，并归入独立分部
    slugOverride: (rel) => {
      const m = rel.match(/^ml\/(\d+)\.md$/);
      return m ? `qa-ml-q${m[1]}` : null;
    },
    partFor: (rel) => {
      if (rel.startsWith('ml/')) return { title: '机器学习 · 工程实践题', order: 3 };
      if (rel.startsWith('qa-ml/')) return { title: '机器学习面试题', order: 2 };
      return { title: 'Go 语言面试题', order: 1 };
    },
    // 无 frontmatter 文章的标题：机器学习面试题 N：xxx
    titleForNoFm: (rel, heading) => {
      const m = rel.match(/^ml\/(\d+)\.md$/);
      if (!m) return heading;
      return `机器学习面试题 ${m[1]}：${heading.replace(/^\d+[.、]\s*/, '')}`;
    },
  },
  {
    dir: 'high-performance-go',
    id: 'high-performance-go',
    title: 'Go 语言高性能编程',
    description: 'Go 语言高性能编程，涵盖 benchmark 基准测试、pprof 性能分析、常用数据结构、并发编程、编译优化与语言陷阱。',
    order: 20,
    featured: false,
    tags: ['Go'],
    repo: 'https://github.com/geektutu/high-performance-go',
    // 按 categories 分部（catMap 定义顺序）
    catMap: {
      序言: 1,
      性能分析: 2,
      常用数据结构: 3,
      并发编程: 4,
      编译优化: 5,
      语言陷阱: 6,
    },
  },
];

// high-performance-go：按 categories 分部
{
  const hpg = BOOKS.find((b) => b.id === 'high-performance-go');
  hpg.partFor = (rel, fm) => {
    const cat = Array.isArray(fm.categories) ? fm.categories[0] : '';
    return { title: cat || PART_DEFAULT.title, order: hpg.catMap[cat] ?? 99 };
  };
}

/** Date → 'YYYY-MM-DD HH:mm:ss'（yaml.load 会把日期解析为 Date 对象） */
function fmtDate(d) {
  if (!(d instanceof Date)) return String(d);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === '.git') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(full));
    else if (e.name.endsWith('.md') && e.name !== 'README.md') out.push(full);
  }
  return out;
}

/** 文件在仓库中的首次提交时间（用于无 frontmatter 文章的日期） */
const gitDateCache = new Map();
function gitCreatedDate(repo, rel) {
  const key = `${repo}/${rel}`;
  if (gitDateCache.has(key)) return gitDateCache.get(key);
  let date = '';
  try {
    date = execFileSync('git', ['-C', path.join(SRC, repo), 'log', '--diff-filter=A', '--format=%ai', '--', rel], { encoding: 'utf8' }).trim().split('\n').pop();
  } catch {
    // ignore
  }
  gitDateCache.set(key, date);
  return date;
}

/** 解析图片引用：返回 { found, absPath } */
function resolveImage(repoDir, mdDir, ref) {
  const clean = ref.split('#')[0].split('?')[0];
  if (!clean || /^(https?:|data:|mailto:)/i.test(clean)) return null;
  const basename = path.basename(clean);
  const candidates = [path.resolve(mdDir, clean), path.resolve(repoDir, clean)];
  // 旧站路径 post/<slug>/x.jpg → md 目录下的 <slug>/x.jpg
  const stripped = clean.replace(/^\/?(?:post\/)?/, '');
  candidates.push(path.resolve(mdDir, stripped));
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  }
  return { missing: basename };
}

/** 重写正文中的图片引用，并收集需要复制的文件 */
function rewriteImages(body, repoDir, mdDir, slug, bookPostDir, copied, warnings, relName) {
  const rewriteRef = (ref) => {
    const resolved = resolveImage(repoDir, mdDir, ref);
    if (!resolved) return ref; // 外部链接原样保留
    if (resolved.missing) {
      warnings.push(`[图片缺失] ${relName}: ${ref}`);
      return ref;
    }
    const destName = `${slug}/${path.basename(resolved)}`;
    const destAbs = path.join(bookPostDir, destName);
    if (copied.has(destAbs) && copied.get(destAbs) !== resolved) {
      warnings.push(`[文件名冲突] ${relName}: ${ref} 与已复制文件重名`);
    }
    copied.set(destAbs, resolved);
    return destName;
  };

  body = body.replace(/(!\[[^\]]*\]\()((?!https?:\/\/|data:|#)[^)\s]+)([^)]*\))/gi, (_, pre, ref, rest) => pre + rewriteRef(ref) + rest);
  body = body.replace(/(<img[^>]+src=["'])((?!https?:\/\/|data:|#)[^"']+)["']/gi, (_, pre, ref) => `${pre}${rewriteRef(ref)}"`);
  return body;
}

let totalImported = 0;
const allWarnings = [];

for (const book of BOOKS) {
  const repoDir = path.join(SRC, book.dir);
  const bookPostDir = path.join(DEST, book.dir);
  if (!fs.existsSync(repoDir)) {
    console.warn(`跳过（仓库不存在）: ${repoDir}`);
    continue;
  }
  fs.rmSync(bookPostDir, { recursive: true, force: true });
  fs.mkdirSync(bookPostDir, { recursive: true });

  const copied = new Map(); // destAbs -> srcAbs
  const parts = new Map(); // partTitle -> { order, chapters: [{slug, date, sort}] }

  for (const file of walk(repoDir).sort()) {
    const rel = path.relative(repoDir, file);
    const mdDir = path.dirname(file);
    let slug = path.basename(file, '.md');
    const override = book.slugOverride?.(rel);
    if (override) slug = override;

    const raw = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
    const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n?/);
    const fm = fmMatch ? (yaml.load(fmMatch[1]) || {}) : {};
    let body = fmMatch ? raw.slice(fmMatch[0].length) : raw;

    // 日期：frontmatter > git 首次提交 > 兜底
    let date = fm.date ? fmtDate(fm.date) : gitCreatedDate(book.dir, rel).replace(/\s+\+\d{4}$/, '');
    if (!date) {
      allWarnings.push(`[无日期] ${book.dir}/${rel}，使用 1970-01-01`);
      date = '1970-01-01';
    }

    // 标题：frontmatter > 一级标题 > 文件名
    let title = fm.title;
    if (!title) {
      const h1 = body.match(/^#\s+(.+)$/m);
      title = book.titleForNoFm?.(rel, h1 ? h1[1].trim() : '') || h1?.[1]?.trim() || slug;
    }

    // 分部
    const part = book.partFor?.(rel, fm) ?? book.parts?.[fm.categories?.[0]] ?? PART_DEFAULT;
    if (!parts.has(part.title)) parts.set(part.title, { order: part.order, chapters: [] });

    // 图片
    const relName = `${book.dir}/${rel}`;
    body = rewriteImages(body, repoDir, mdDir, slug, bookPostDir, copied, allWarnings, relName);

    // 封面
    let cover;
    if (fm.image) {
      const resolved = resolveImage(repoDir, mdDir, String(fm.image));
      if (resolved && !resolved.missing) {
        cover = `${slug}/${path.basename(resolved)}`;
        copied.set(path.join(bookPostDir, cover), resolved);
      } else {
        allWarnings.push(`[封面缺失] ${relName}: ${fm.image}`);
      }
    }

    const tags = Array.isArray(fm.tags) && fm.tags.length ? fm.tags : book.tags;

    const newFm = {
      title,
      description: fm.description ?? '',
      date,
      tags,
      book: book.id,
      status: 'done',
      draft: false,
    };
    if (cover) newFm.cover = cover;

    fs.writeFileSync(path.join(bookPostDir, `${slug}.md`), `---\n${yaml.dump(newFm, { lineWidth: 120 })}---\n\n${body.trim()}\n`);

    // 章节排序：日期优先，日期相同按 slug 中的数字（qa-ml-qN）
    const num = slug.match(/(\d+)$/)?.[1];
    parts.get(part.title).chapters.push({ slug, date: new Date(date).getTime() || 0, sort: num ? Number(num) : 0 });
    totalImported++;
  }

  // 复制图片
  for (const [destAbs, srcAbs] of copied) {
    fs.mkdirSync(path.dirname(destAbs), { recursive: true });
    fs.copyFileSync(srcAbs, destAbs);
  }

  // 生成书籍
  const outline = [...parts.entries()]
    .sort((a, b) => a[1].order - b[1].order)
    .map(([partTitle, { chapters }]) => ({
      part: partTitle,
      // 有短标题的章节写为 { slug, short }，其余保持纯字符串
      chapters: chapters
        .sort((a, b) => a.date - b.date || a.sort - b.sort)
        .map((c) => (book.shortTitles?.[c.slug] ? { slug: c.slug, short: book.shortTitles[c.slug] } : c.slug)),
    }));

  const bookFm = {
    id: book.id,
    title: book.title,
    description: book.description,
    order: book.order,
    featured: book.featured,
    outline,
  };
  if (book.repo) bookFm.repo = book.repo;
  if (book.cover) bookFm.cover = book.cover;
  fs.writeFileSync(path.join(BOOK_DEST, `${book.id}.md`), `---\n${yaml.dump(bookFm, { lineWidth: 120 })}---\n`);

  console.log(`「${book.title}」导入 ${[...parts.values()].reduce((n, p) => n + p.chapters.length, 0)} 章 / ${outline.length} 个分部，复制 ${copied.size} 张图片。`);
}

if (allWarnings.length) {
  console.log('\n警告：');
  allWarnings.forEach((w) => console.log('  ' + w));
}
console.log(`\n共导入 ${totalImported} 篇文章。`);
