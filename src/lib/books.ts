import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;
export type Book = CollectionEntry<'books'>;

export interface ChapterItem {
  slug: string;
  /** 侧边栏等紧凑场景使用的简短标题（来自 outline），缺省时回退到文章标题 */
  short?: string;
  part?: string;
  post: Post | null;
}

/** 全部已发布文章（不含草稿） */
export async function getPublishedPosts(): Promise<Post[]> {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  return posts.sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime()
  );
}

/** 全部书，按 order 排序 */
export async function getBooks(): Promise<Book[]> {
  const books = await getCollection('books');
  return books.sort((a, b) => a.data.order - b.data.order);
}

/** 根据书的 outline 生成有序章节列表 */
export async function getBookChapters(bookId: string): Promise<ChapterItem[]> {
  const [book, posts] = await Promise.all([
    getCollection('books'),
    getCollection('posts'),
  ]);
  const theBook = book.find((b) => b.data.id === bookId);
  if (!theBook) return [];

  const postMap = new Map(posts.map((p) => [p.id, p]));

  const chapters: ChapterItem[] = [];
  for (const group of theBook.data.outline) {
    for (const ch of group.chapters) {
      const slug = typeof ch === 'string' ? ch : ch.slug;
      const short = typeof ch === 'string' ? undefined : ch.short;
      chapters.push({
        slug,
        short,
        part: group.part,
        post: postMap.get(slug) ?? null,
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
