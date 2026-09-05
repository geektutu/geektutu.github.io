import rss from '@astrojs/rss';
import { getPublishedPosts } from '../../lib/books';
import { getDict } from '../../lib/i18n';

const lang = 'en' as const;

export async function GET(context: { site: string }) {
  const t = getDict(lang);
  const posts = await getPublishedPosts(lang);
  return rss({
    title: t.siteName,
    description: t.defaultDescription,
    site: context.site,
    // 英文文章位于 /en/ 前缀下
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/en/post/${post.id}.html`,
    })),
  });
}
