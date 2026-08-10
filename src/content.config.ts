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
 * 文章（posts）：文件名即 slug。
 * book 声明所属书；status 用于书稿看板；draft 控制是否公开。
 */
const posts = defineCollection({
  loader: glob({ base: './src/content/posts', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    description: z.string().default(''),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    book: z.string().optional(),
    cover: z.string().optional(),
    status: z.enum(['draft', 'wip', 'done']).default('done'),
    draft: z.boolean().default(false),
  }),
});

export const collections = { books, posts };
