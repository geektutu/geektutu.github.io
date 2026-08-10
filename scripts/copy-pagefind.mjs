/**
 * 将 pagefind 生成的索引从 dist/pagefind 复制到 public/pagefind，
 * 使开发服务器也能访问 /pagefind/（Pagefind 仅在构建后生成索引）。
 */
import { cpSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SRC = join(ROOT, 'dist/pagefind');
const DEST = join(ROOT, 'public/pagefind');

if (!existsSync(SRC)) {
  console.log('未找到 dist/pagefind，跳过复制。');
  process.exit(0);
}

rmSync(DEST, { recursive: true, force: true });
cpSync(SRC, DEST, { recursive: true });
console.log('✔ 已同步 Pagefind 索引到 public/pagefind（供开发服务器使用）。');
