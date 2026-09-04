/**
 * 从 @fontsource-variable/literata 生成站点专用 latin 子集字体。
 * 字符集 = ASCII + 常用标点 + 自动扫描 src/content 下的 .md 文件中实际出现的扩展字符，
 * 因此 npm run build 每次重新生成时新文章的字符自动纳入，无需手动维护。
 * 极少数仍在子集之外的字符（如代码块中的生僻符号）由系统 Songti SC 按字素兜底。
 */
import subsetFont from 'subset-font';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

async function listMarkdown(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await listMarkdown(p)));
    else if (extname(entry.name) === '.md') out.push(p);
  }
  return out;
}

const files = await listMarkdown(join(root, 'src/content'));
const used = new Set();
for (const f of files) {
  const text = await readFile(f, 'utf8');
  for (const ch of text) {
    const code = ch.codePointAt(0);
    if (code >= 0xa0 && code <= 0x24f) used.add(code);
  }
}

// subset-font 第二个参数是文本字符串（非 U+ 范围语法）
// ASCII 可打印 + 弯引号/破折号/省略号常驻；扩展字符按内容扫描
const text = [
  ...Array.from({ length: 0x7f - 0x20 }, (_, i) => String.fromCodePoint(0x20 + i)),
  '–—‘’“”…',
  ...[...used].map((c) => String.fromCodePoint(c)),
].join('');

const src = await readFile(join(root, 'node_modules/@fontsource-variable/literata/files/literata-latin-wght-normal.woff2'));
await mkdir(join(root, 'public/fonts'), { recursive: true });
const buf = await subsetFont(src, text, { targetFormat: 'woff2' });
await writeFile(join(root, 'public/fonts/literata-latin-subset.woff2'), buf);
console.log(`literata-latin-subset.woff2: ${(buf.length / 1024).toFixed(1)}KB（${text.length} 字符，含扩展 ${used.size} 个）`);
