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
    outline: z
      .array(
        z.object({
          part: z.string().optional(),
          chapters: z.array(z.string()).default([]),
        })
      )
      .default([]),
  }),
});

/**
 * 文章（posts）：与存量仓库格式一致——
 *   src/content/posts/<slug>.md          正文
 *   src/content/posts/<slug>/            该文章的图片目录
 * markdown 中以相对路径引用：<slug>/xxx.png。
 * book 声明所属书；status 用于书稿看板；draft 控制是否公开。
 */
const posts = defineCollection({
  loader: glob({
    base: './src/content/posts',
    pattern: '*.md',
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
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
    }),
});

export const collections = { books, posts };
