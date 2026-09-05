import { getCollection, type CollectionEntry } from 'astro:content';
import type { Lang } from './i18n';

export type { Lang };
export type RawPost = CollectionEntry<'posts'> | CollectionEntry<'posts-en'>;
export type RawBook = CollectionEntry<'books'> | CollectionEntry<'books-en'>;

/** 带语言标记的文章（posts/posts-en 结构相同，见 content.config.ts 共享 schema） */
export type Post = RawPost & { lang: Lang };
/** 带语言标记的书（books/books-en 结构相同） */
export type Book = RawBook & { lang: Lang };

export interface ChapterItem {
  slug: string;
  /** 侧边栏等紧凑场景使用的简短标题（来自 outline），缺省时回退到文章标题 */
  short?: string;
  part?: string;
  post: Post | null;
  /** 章节所属语言（与所属书一致），用于生成链接 */
  lang: Lang;
}

const postColl = { zh: 'posts', en: 'posts-en' } as const;
const bookColl = { zh: 'books', en: 'books-en' } as const;

/** 全部已发布文章（不含草稿），按时间倒序 */
export async function getPublishedPosts(lang: Lang = 'zh'): Promise<Post[]> {
  const raw = await getCollection(postColl[lang], ({ data }) => !data.draft);
  const posts: Post[] = raw.map((p) => ({ ...p, lang }));
  return posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/** 全部书，按 order 排序；order 相同时按最新文章的日期，新的在前 */
export async function getBooks(lang: Lang = 'zh'): Promise<Book[]> {
  const [bookCollEntries, posts] = await Promise.all([
    getCollection(bookColl[lang]),
    getCollection(postColl[lang]),
  ]);
  const postMap = new Map(posts.map((p) => [p.id, p]));
  const newestDate = (book: RawBook): number => {
    let latest = 0;
    for (const group of book.data.outline) {
      for (const ch of group.chapters) {
        const post = postMap.get(typeof ch === 'string' ? ch : ch.slug);
        if (post && post.data.date.getTime() > latest) latest = post.data.date.getTime();
      }
    }
    return latest;
  };
  const books: Book[] = bookCollEntries.map((b) => ({ ...b, lang }));
  return books.sort(
    (a, b) => a.data.order - b.data.order || newestDate(b) - newestDate(a)
  );
}

/** 根据书的 outline 生成有序章节列表 */
export async function getBookChapters(bookId: string, lang: Lang = 'zh'): Promise<ChapterItem[]> {
  const [books, posts] = await Promise.all([
    getCollection(bookColl[lang]),
    getCollection(postColl[lang]),
  ]);
  const theBook = books.find((b) => b.data.id === bookId);
  if (!theBook) return [];

  const postMap = new Map(posts.map((p) => [p.id, p]));

  const chapters: ChapterItem[] = [];
  for (const group of theBook.data.outline) {
    for (const ch of group.chapters) {
      const slug = typeof ch === 'string' ? ch : ch.slug;
      const short = typeof ch === 'string' ? undefined : ch.short;
      const post = postMap.get(slug);
      chapters.push({
        slug,
        short,
        part: group.part,
        post: post ? ({ ...post, lang } as Post) : null,
        lang,
      });
    }
  }
  return chapters;
}

/** 章节的前一篇/后一篇 */
export function getAdjacentChapters(
  chapters: ChapterItem[],
  currentSlug: string
): { prev?: ChapterItem; next?: ChapterItem } {
  const idx = chapters.findIndex((c) => c.slug === currentSlug);
  if (idx === -1) return {};
  return {
    prev: idx > 0 ? chapters[idx - 1] : undefined,
    next: idx < chapters.length - 1 ? chapters[idx + 1] : undefined,
  };
}

/* ---------- URL 工具（按语言生成前缀） ---------- */

export function postHref(lang: Lang, id: string): string {
  return `${lang === 'en' ? '/en' : ''}/post/${id}.html`;
}

export function bookHref(lang: Lang, id: string): string {
  return `${lang === 'en' ? '/en' : ''}/books/${id}`;
}

export function tagHref(lang: Lang, tag: string): string {
  return `${lang === 'en' ? '/en' : ''}/tags/${tag}`;
}

export function pageHref(lang: Lang, n: number): string {
  const base = `${lang === 'en' ? '/en' : ''}/`;
  return n <= 1 ? base : `${base}page/${n}`;
}

/** Gitalk issue id：沿用旧站 pathname 约定，语言前缀区分评论 */
export function gitalkId(lang: Lang, id: string): string {
  return `${lang === 'en' ? '/en' : ''}/post/${id}.html`;
}

/** 阅读时长估算：中文按字数（约 1200 字/分钟），英文按词数（约 200 词/分钟） */
export function readingTime(body: string | undefined, lang: Lang): number {
  if (!body) return 1;
  if (lang === 'en') {
    return Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / 200));
  }
  return Math.max(1, Math.round(body.length / 1200));
}
