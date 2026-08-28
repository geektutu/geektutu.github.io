import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * 书（books）：一本书的元数据 + 书稿大纲 outline。
 * outline 是章节 slug 的有序清单，可带 part（分部/卷）分组。
 * 章节顺序 / 分部完全由 outline 派生。
 */
const books = defineCollection({
  loader: glob({ base: './src/content/books', pattern: '**/*.md' }),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().default(''),
    cover: z.string().optional(),
    order: z.number().default(0),
    featured: z.boolean().default(false),
    /** 书籍配套仓库，章节页会在正文顶部提示 */
    repo: z.string().optional(),
    outline: z
      .array(
        z.object({
          part: z.string().optional(),
          chapters: z
            .array(
              z.union([
                z.string(),
                z.object({ slug: z.string(), short: z.string().optional() }),
              ])
            )
            .default([]),
        })
      )
      .default([]),
  }),
});

/**
 * 文章（posts）：按书分目录存放——
 *   src/content/posts/<bookDir>/<slug>.md        正文
 *   src/content/posts/<bookDir>/<slug>/          该文章的图片目录
 * markdown 中以相对路径引用：<slug>/xxx.png。
 * id 只取文件名（<slug>），与 URL /post/<slug>/ 及书 outline 的章节 slug 一致；
 * 新增其他书时，在 posts 下新建对应子目录即可。
 * book 声明所属书；status 用于书稿看板；draft 控制是否公开。
 */
const posts = defineCollection({
  loader: glob({
    base: './src/content/posts',
    pattern: '**/*.md',
    generateId: ({ entry }) => entry.replace(/\.md$/, '').split('/').pop()!,
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string().default(''),
      date: z.coerce.date(),
      updated: z.coerce.date().optional(),
      tags: z.array(z.string()).default([]),
      book: z.string().optional(),
      cover: image().optional(),
      status: z.enum(['draft', 'wip', 'done']).default('done'),
      draft: z.boolean().default(false),
      /** 单篇文章配套仓库（优先级高于所属书的 repo），正文顶部提示 */
      repo: z.string().optional(),
    }),
});

export const collections = { books, posts };
