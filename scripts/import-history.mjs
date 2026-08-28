import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const SRC = path.resolve('../geektutu.github.io/posts');
const POSTS_DEST = path.resolve('src/content/posts/history');
const BOOK_DEST = path.resolve('src/content/books/history.md');
const BOOK_ID = 'history';

const PART_INFO = {
  'blog-experience': { title: '建站经历', order: 1 },
  'quick-start': { title: '快速上手', order: 2, sub: { go: 'Go', python: 'Python', rust: 'Rust' } },
  'tensorflow': { title: 'TensorFlow 教程', order: 3 },
  'data-mining': { title: '数据挖掘', order: 4 },
  'cheat-sheet': { title: '速查表', order: 5 },
  'pandora-box': { title: '潘多拉魔盒', order: 6 },
  'summary': { title: '年度总结', order: 7 },
};

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(full));
    else if (e.name.endsWith('.md')) out.push(full);
  }
  return out;
}

function rewriteImages(body, slug) {
  const fix = (p) => {
    let np = p.trim();
    if (np.startsWith('post/')) np = '/' + np;
    else if (np.startsWith(slug + '/')) np = '/post/' + np;
    return np;
  };
  body = body.replace(/(!\[[^\]]*\]\()((?!https?:\/\/|data:|#)[^)]+)/g, (_, pre, p) => pre + fix(p));
  body = body.replace(/(<img[^>]+src=["'])((?!https?:\/\/|data:|#|\/)[^"']+)/gi, (_, pre, p) => pre + fix(p));
  return body;
}

const files = walk(SRC).filter((f) => {
  const rel = path.relative(SRC, f);
  if (path.basename(f) === 'README.md') return false;
  if (rel.split(path.sep).includes('about')) return false;
  return true;
});

const chaptersByPart = new Map();
const imported = [];

for (const file of files) {
  const rel = path.relative(SRC, file);
  const parts = rel.split(path.sep);
  const cat = parts[0];
  const slug = path.basename(file, '.md');
  const mdDir = path.dirname(file);

  const raw = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!fmMatch) {
    console.warn('跳过（无 frontmatter）:', rel);
    continue;
  }
  const fmRaw = fmMatch[1];
  const fm = yaml.load(fmRaw) || {};
  let body = raw.slice(fmMatch[0].length);

  const dateLine = fmRaw.match(/^date:\s*(.+)$/m);
  const rawDate = dateLine ? dateLine[1].trim() : fm.date ? String(fm.date) : '';

  const newFm = {
    title: fm.title ?? slug,
    description: fm.description ?? '',
    date: rawDate,
    tags: Array.isArray(fm.tags) ? fm.tags : [],
    book: BOOK_ID,
    status: 'done',
    draft: false,
  };
  if (fm.image) {
    // 源站 cover 形如 post/<slug>/x.jpg，改为相对 md 的 <slug>/x.jpg
    const coverName = String(fm.image).split('/').pop();
    newFm.cover = `${slug}/${coverName}`;
  }

  body = rewriteImages(body, slug);
  // 源站图片引用（/post/<slug>/x、post/<slug>/x）统一转为相对 md 的 <slug>/x，与存量仓库格式一致
  body = body.replace(/\]\((?:\/?post\/)?(?:\.\.\/)*[^/)]+\/([^/)#]+\.(?:png|jpe?g|gif|webp|svg|pdf))\)/gi, `](${slug}/$1)`);

  fs.writeFileSync(path.join(POSTS_DEST, slug + '.md'), `---\n${yaml.dump(newFm, { lineWidth: 120 })}---\n\n${body.trim()}\n`);

  // 复制图片目录（与 md 平铺同目录）
  const imgSrc = path.join(mdDir, slug);
  if (fs.existsSync(imgSrc) && fs.statSync(imgSrc).isDirectory()) {
    fs.cpSync(imgSrc, path.join(POSTS_DEST, slug), { recursive: true });
  }

  // 计算分组
  const info = PART_INFO[cat] || { title: cat, order: 99 };
  let partTitle = info.title;
  let partOrder = info.order * 100;
  if (cat === 'quick-start' && parts.length >= 3) {
    const sub = parts[1];
    const subLabel = info.sub?.[sub] ?? sub;
    const subIdx = ['go', 'python', 'rust'].indexOf(sub);
    partTitle = `快速上手 · ${subLabel}`;
    partOrder = info.order * 100 + (subIdx < 0 ? 0 : subIdx) * 10;
  }
  if (!chaptersByPart.has(partTitle)) chaptersByPart.set(partTitle, { order: partOrder, chapters: [] });
  chaptersByPart.get(partTitle).chapters.push({ slug, date: new Date(rawDate).getTime() || 0 });

  imported.push(slug);
}

// 生成 book outline
const outline = [...chaptersByPart.entries()]
  .sort((a, b) => a[1].order - b[1].order)
  .map(([part, { chapters }]) => ({
    part,
    chapters: chapters.sort((a, b) => a.date - b.date).map((c) => c.slug),
  }));

const bookFm = {
  id: BOOK_ID,
  title: '历史博客',
  description: '极客兔兔早期博客文章合集（建站经历、TensorFlow 教程、快速上手、数据挖掘等）。',
  order: 100,
  featured: false,
  outline,
};
fs.writeFileSync(BOOK_DEST, `---\n${yaml.dump(bookFm, { lineWidth: 120 })}---\n`);

console.log(`导入 ${imported.length} 篇文章，生成书籍「历史博客」（${outline.length} 个分组）。`);
