import rss from '@astrojs/rss';
import { getPublishedPosts } from '../lib/books';

export async function GET(context: { site: string }) {
  const posts = await getPublishedPosts();
  return rss({
    title: 'Geektutu 的笔记本',
    description: '把技术文章组织成书的静态博客',
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/post/${post.id}.html`,
    })),
  });
}
