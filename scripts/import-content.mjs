/**
 * 导入「新版式」源仓库（pull.sh 拉取）：内容自带完整 frontmatter，脚本只负责
 * 按约定拷贝进 src，不改写任何内容（原 import-repos.mjs 的旧版式改写流程已随
 * 全部仓库迁入新版式而下线）。仓库迁入新版式后会被自动识别，无需登记配置。
 *
 * 识别规则（约定优先，无需配置）：
 *   - 书籍元数据 md：frontmatter 同时含 id 和 outline → src/content/books/<id>.md
 *   - 正文 md：frontmatter 含 book（值须为书籍 id）→ src/content/posts/<id>/
 *   - 语言路由：frontmatter lang: en → books-en/posts-en（id 与章节 slug 与中文一致，
 *     对齐 books-en/history.md 约定）；缺省视为中文
 *
 * 按内容分布自动选择拷贝方式：
 *   - 集中式（如 7days-geekagent/doc/）：书籍 md 与正文 md 的最近公共目录整体拷贝，
 *     图片等资源随目录原样带走，相对引用保持不变
 *   - 分散式（如 7days-golang，正文位于各子目录 doc/、书籍 md 在仓库根）：
 *     逐篇拷贝正文到目标根目录，并按正文及 frontmatter cover/image 中的本地引用
 *     （先相对正文所在目录、再相对仓库根解析）补拷图片
 *
 * 每次导入先清空目标目录再重拷，源仓库删除的文件不会残留；缺失的 .gitignore 条目自动补上。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SRC = path.join(ROOT, 'posts');
const GITIGNORE = path.join(ROOT, '.gitignore');

const SKIP_DIRS = new Set(['.git', 'node_modules']);
const SKIP_FILES = new Set(['README.md', '.DS_Store']);

const warnings = [];
const reported = new Set();
function warn(key, msg) {
  if (reported.has(key)) return;
  reported.add(key);
  warnings.push(msg);
}

/** fm.lang → 语言键；约定 lang: en 为英文，缺省为中文 */
function langOf(fm) {
  if (fm?.lang === 'en') return 'en';
  if (fm?.lang !== undefined) warn(`lang:${fm.lang}`, `[未支持的语言] lang: ${fm.lang}（仅支持 en，缺省视为中文）`);
  return 'zh';
}

/** 语言 → 目标集合（-en 后缀） */
function destsFor(lang) {
  const suffix = lang === 'en' ? '-en' : '';
  return {
    posts: path.join(ROOT, `src/content/posts${suffix}`),
    books: path.join(ROOT, `src/content/books${suffix}`),
    badge: suffix ? '（en）' : '',
    suffix,
  };
}

/** 递归收集 md 文件（跳过 .git、node_modules 等目录与 README） */
function walkMd(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name) && !e.name.startsWith('.')) out.push(...walkMd(path.join(dir, e.name)));
    } else if (e.name.endsWith('.md') && !SKIP_FILES.has(e.name)) {
      out.push(path.join(dir, e.name));
    }
  }
  return out;
}

/** 解析 frontmatter，无 frontmatter 或解析失败返回 null */
function frontmatter(file) {
  const raw = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  try {
    return yaml.load(m[1]) || null;
  } catch {
    warn(`fm:${file}`, `[frontmatter 解析失败] ${path.relative(ROOT, file)}`);
    return null;
  }
}

/** 一组文件的最近公共祖先目录 */
function commonDir(files) {
  let parts = path.dirname(files[0]).split(path.sep);
  for (const f of files.slice(1)) {
    const segs = path.dirname(f).split(path.sep);
    let i = 0;
    while (i < parts.length && i < segs.length && parts[i] === segs[i]) i++;
    parts = parts.slice(0, i);
  }
  return parts.join(path.sep) || path.sep;
}

/** outline 中声明的章节 slug（兼容 string 与 { slug, short }） */
function outlineSlugs(outline) {
  return (outline ?? [])
    .flatMap((p) => p?.chapters ?? [])
    .map((c) => (typeof c === 'string' ? c : c?.slug))
    .filter(Boolean);
}

/** 剥离 frontmatter、代码块与行内代码后的正文（引用扫描用，避免把 Go 代码当链接） */
function bodyForScan(raw) {
  return raw
    .replace(/^---\r?\n[\s\S]*?\r?\n---/, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`\n]*`/g, '');
}

/** 正文中的本地引用：markdown 链接/图片 与 <img src> */
function localRefs(body) {
  return [
    ...[...body.matchAll(/!?\[[^\]]*\]\(([^)\s]+)[^)]*\)/gi)].map((m) => m[1]),
    ...[...body.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)].map((m) => m[1]),
  ];
}

/** 引用归类：外部链接、站内绝对路径、其他 md 返回 null；其余返回解码后的相对路径 */
function localRef(ref) {
  const clean = ref.split('#')[0].split('?')[0];
  if (!clean || clean.includes('://') || /^(https?:|data:|mailto:)/i.test(clean) || clean.startsWith('/') || /\.md$/i.test(clean)) return null;
  try {
    return decodeURIComponent(clean);
  } catch {
    return clean;
  }
}

/** 分散式：逐篇拷贝正文，并按本地引用从原仓库补拷图片（引用不改写） */
function copyScattered(repoDir, dest, contentFiles, id) {
  const seen = new Set();
  for (const file of contentFiles.sort()) {
    const destMd = path.join(dest, path.basename(file));
    if (seen.has(destMd)) {
      warn(`dup:${destMd}`, `[文件名冲突] ${id}: ${path.basename(file)} 在仓库多处出现，仅保留一份`);
      continue;
    }
    seen.add(destMd);
    fs.copyFileSync(file, destMd);

    const copyRef = (ref) => {
      const decoded = localRef(ref);
      if (!decoded) return;
      const destAbs = path.resolve(dest, decoded);
      if (!destAbs.startsWith(dest + path.sep)) {
        warn(`esc:${id}:${ref}`, `[引用越界] ${id}/${path.basename(file)}: ${ref} 指向目标目录之外`);
        return;
      }
      if (fs.existsSync(destAbs)) return;
      for (const base of [path.dirname(file), repoDir]) {
        const src = path.resolve(base, decoded);
        if (fs.existsSync(src) && fs.statSync(src).isFile()) {
          fs.mkdirSync(path.dirname(destAbs), { recursive: true });
          fs.copyFileSync(src, destAbs);
          return;
        }
      }
      warn(`miss:${id}:${file}:${ref}`, `[引用缺失] ${id}/${path.basename(file)}: ${ref}`);
    };

    const fm = frontmatter(file);
    for (const f of [fm?.cover, fm?.image]) if (typeof f === 'string') copyRef(f);

    for (const ref of localRefs(bodyForScan(fs.readFileSync(file, 'utf8')))) copyRef(ref);
  }
  return seen.size;
}

/** 检查拷贝结果：frontmatter 封面与正文本地引用都能在目标目录内解析 */
function auditBook(dest, id) {
  for (const md of walkMd(dest)) {
    const raw = fs.readFileSync(md, 'utf8');
    const rel = path.relative(dest, md);
    const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    let fm = null;
    try {
      fm = m ? yaml.load(m[1]) || null : null;
    } catch {
      // 解析失败已在导入侧告警
    }
    const check = (ref) => {
      const decoded = localRef(ref);
      if (decoded && !fs.existsSync(path.resolve(path.dirname(md), decoded))) {
        warn(`audit:${id}:${rel}:${ref}`, `[引用缺失] ${id}/${rel}: ${ref}`);
      }
    };
    for (const f of [fm?.cover, fm?.image]) if (typeof f === 'string') check(f);
    for (const ref of localRefs(bodyForScan(raw))) check(ref);
  }
}

/** 把缺失的生成路径追加进 .gitignore */
function ensureGitignore(entries) {
  const raw = fs.readFileSync(GITIGNORE, 'utf8');
  const lines = new Set(raw.split('\n').map((l) => l.trim()));
  const missing = entries.filter((e) => !lines.has(e));
  if (!missing.length) return;
  const base = raw === '' || raw.endsWith('\n') ? raw : raw + '\n';
  fs.writeFileSync(GITIGNORE, `${base}\n# import-content.mjs 生成（新版式源仓库拷贝，可随时重新生成）\n${missing.join('\n')}\n`);
}

function importBook(repo, repoDir, book, contentFiles, allBookMdFiles) {
  const id = book.fm.id;
  if (!/^[\w-]+$/.test(id)) {
    warn(`id:${id}`, `[非法 id] ${path.relative(ROOT, book.file)}: ${id}`);
    return;
  }
  const { posts: POSTS, books: BOOKS, badge, suffix } = destsFor(book.lang);
  const dest = path.join(POSTS, id);
  fs.rmSync(dest, { recursive: true, force: true });

  const source = contentFiles.length ? commonDir([book.file, ...contentFiles]) : path.dirname(book.file);
  if (source === repoDir) {
    fs.mkdirSync(dest, { recursive: true });
    copyScattered(repoDir, dest, contentFiles, id);
    const dirs = new Set(contentFiles.map((f) => path.relative(repoDir, path.dirname(f))));
    console.log(`「${book.fm.title ?? id}」${id}${badge}：${contentFiles.length} 篇正文（分散于 ${dirs.size} 个目录）→ src/content/posts${suffix}/${id}`);
  } else {
    fs.cpSync(source, dest, {
      recursive: true,
      filter: (src) =>
        !SKIP_DIRS.has(path.basename(src)) &&
        !SKIP_FILES.has(path.basename(src)) &&
        !allBookMdFiles.has(path.normalize(src)),
    });
    console.log(`「${book.fm.title ?? id}」${id}${badge}：${contentFiles.length} 篇正文 → src/content/posts${suffix}/${id}（源：posts/${repo}/${path.relative(repoDir, source) || '.'}）`);
  }

  fs.mkdirSync(BOOKS, { recursive: true });
  fs.copyFileSync(book.file, path.join(BOOKS, `${id}.md`));

  for (const slug of outlineSlugs(book.fm.outline)) {
    if (!fs.existsSync(path.join(dest, `${slug}.md`))) {
      warn(`chap:${id}:${slug}`, `[缺章] ${id}${badge}: outline 引用 ${slug}.md，但拷贝结果中不存在`);
    }
  }
  auditBook(dest, id);
  ensureGitignore([`src/content/posts${suffix}/${id}/`, `src/content/books${suffix}/${id}.md`]);
}

for (const e of fs.readdirSync(SRC, { withFileTypes: true }).filter((e) => e.isDirectory())) {
  const repoDir = path.join(SRC, e.name);
  const files = walkMd(repoDir);

  const books = []; // { file, fm, lang }
  const contentByBook = new Map(); // `${bookId}@${lang}` -> [file]
  for (const file of files) {
    const fm = frontmatter(file);
    if (!fm) continue;
    const lang = langOf(fm);
    if (typeof fm.id === 'string' && Array.isArray(fm.outline)) {
      books.push({ file, fm, lang });
    } else if (typeof fm.book === 'string') {
      const key = `${fm.book}@${lang}`;
      if (!contentByBook.has(key)) contentByBook.set(key, []);
      contentByBook.get(key).push(file);
    }
  }

  if (!books.length) {
    console.log(`跳过（非新版式）：posts/${e.name}`);
    continue;
  }

  const ids = new Set(books.map((b) => `${b.fm.id}@${b.lang}`));
  const allBookMdFiles = new Set(books.map((b) => path.normalize(b.file)));
  for (const [key, fl] of contentByBook) {
    if (!ids.has(key)) {
      const [bookId, lang] = key.split('@');
      warn(`book:${e.name}:${key}`, `[未匹配书籍] posts/${e.name}: ${fl.length} 篇 md 声明 book: ${bookId}${lang === 'en' ? '（lang: en）' : ''}，但没有对应书籍元数据`);
    }
  }

  for (const book of books) {
    importBook(e.name, repoDir, book, contentByBook.get(`${book.fm.id}@${book.lang}`) ?? [], allBookMdFiles);
  }
}

if (warnings.length) {
  console.log('\n警告：');
  warnings.forEach((w) => console.log('  ' + w));
}
