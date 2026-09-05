/**
 * 站点国际化：语言定义、字典与工具函数。
 * 中文为默认语言（URL 无前缀），英文位于 /en/ 前缀下，两种语言共用相同的 slug。
 */

export type Lang = 'zh' | 'en';

/** 各语言的 URL 前缀 */
export const langPrefix: Record<Lang, string> = { zh: '', en: '/en' };

/** <html lang> 值 */
export const htmlLang: Record<Lang, string> = { zh: 'zh-CN', en: 'en' };

/** og:locale 值 */
export const ogLocale: Record<Lang, string> = { zh: 'zh_CN', en: 'en_US' };

/** JSON-LD inLanguage 值 */
export const contentLang: Record<Lang, string> = { zh: 'zh-CN', en: 'en' };

/** hreflang 值 */
export const hreflang: Record<Lang, string> = { zh: 'zh-CN', en: 'en' };

const zh = {
  siteName: '极客兔兔',
  defaultTitle: '极客兔兔',
  defaultDescription: '把技术文章组织成书的个人技术博客',
  tagline: '把技术文章写成书',

  nav: { home: '首页', books: '书', tags: '标签', search: '搜索', about: '关于' },
  langToggle: 'EN',

  home: {
    kicker: '技术 · 写作 · 成书',
    titleLead: '把零散的文章写成一本',
    titleEm: '书',
    featured: '精选书籍',
    allBooks: '全部书 →',
    latest: '最新文章',
    empty: '还没有文章。',
  },

  card: {
    chapters: (n: number) => `${n} 章`,
    startReading: '开始阅读 →',
    readingTime: (n: number) => `${n} 分钟`,
  },

  book: {
    shelf: 'Bookshelf',
    allTitle: '全部书籍',
    intro: '每本书都是一套成体系的技术内容，按章节目录组织，可顺序阅读。',
    toc: '章节目录',
    pending: '待发布',
    pendingWrite: (slug: string) => `${slug}（待写）`,
    chapters: (n: number) => `${n} 章`,
    repoAria: (repo: string) => `GitHub 仓库：${repo}`,
  },

  chapter: {
    toc: '本章目录',
    updated: (d: string) => `更新于 ${d}`,
    readingTime: (n: number) => `约 ${n} 分钟`,
    prev: '← 上一章',
    next: '下一章 →',
    tldr: '本文要点',
    comments: '评论',
  },

  tags: {
    title: '标签',
    description: '按标签浏览文章',
    count: (n: number) => `${n} 篇`,
    empty: '暂无标签。',
    under: (tag: string) => `标签 ${tag} 下的文章`,
  },

  page: {
    title: (n: number) => `文章 第 ${n} 页`,
    description: (n: number) => `极客兔兔博客文章列表，第 ${n} 页。`,
    heading: (n: number) => `文章 · 第 ${n} 页`,
    prev: '上一页',
    next: '下一页',
  },

  search: {
    title: '搜索',
    description: '站内全文搜索',
    heading: '全文搜索',
    placeholder: '输入关键词，例如：字符串、路由、并发…',
    searching: '搜索中…',
    notFound: (term: string) => `未找到与 “${term}” 相关的内容。`,
    found: (n: number) => `找到 ${n} 条结果`,
    indexMissing: '搜索索引尚未生成，请先运行 npm run build。',
  },

  about: {
    title: '关于',
    description: '关于本站与作者',
    kicker: 'About',
    heading: '关于本站',
    intro:
      '这是一个把技术文章组织成「书」的静态博客。每本书有清晰的章节目录，你可以像读纸质书一样顺序阅读，也可以随时跳转到任意章节。',
    tech: '本站由 Astro 构建，内容以 Markdown 管理，输出纯静态站点，支持明暗主题、全文搜索与书稿式打印。',
    authorHeading: '作者',
    author:
      '本站作者 Geektutu（极客兔兔），常用 Go / TypeScript 写代码，喜欢把系列教程整理成一本本可以在线阅读的书，所有配套代码开源在 GitHub。',
    subscribe: '订阅与联系',
    rss: 'RSS 订阅',
    statsBook: '本书',
    statsChapter: '章节',
    statsTag: '标签',
  },

  tip: {
    title: '如果文章对你有帮助，欢迎赞赏支持 ☕',
    alipay: '支付宝',
    wechat: '微信',
  },

  misc: {
    statsVisits: '总访问量',
    statsPageViews: '本页阅读量',
  },
};

const en: typeof zh = {
  siteName: 'Geektutu',
  defaultTitle: 'Geektutu',
  defaultDescription: 'A personal tech blog that turns tutorial articles into readable books',
  tagline: 'Turning articles into books',

  nav: { home: 'Home', books: 'Books', tags: 'Tags', search: 'Search', about: 'About' },
  langToggle: '中文',

  home: {
    kicker: 'Code · Writing · Books',
    titleLead: 'Turn scattered articles into a',
    titleEm: 'book',
    featured: 'Featured books',
    allBooks: 'All books →',
    latest: 'Latest posts',
    empty: 'No posts yet — the English edition is on its way. Read the Chinese original meanwhile.',
  },

  card: {
    chapters: (n: number) => `${n} ${n === 1 ? 'chapter' : 'chapters'}`,
    startReading: 'Start reading →',
    readingTime: (n: number) => `${n} min read`,
  },

  book: {
    shelf: 'Bookshelf',
    allTitle: 'All books',
    intro: 'Every book is a structured series, organized into chapters that you can read in order.',
    toc: 'Contents',
    pending: 'Not yet published',
    pendingWrite: (slug: string) => `${slug} (upcoming)`,
    chapters: (n: number) => `${n} ${n === 1 ? 'chapter' : 'chapters'}`,
    repoAria: (repo: string) => `GitHub repository: ${repo}`,
  },

  chapter: {
    toc: 'On this page',
    updated: (d: string) => `Updated ${d}`,
    readingTime: (n: number) => `${n} min read`,
    prev: '← Previous chapter',
    next: 'Next chapter →',
    tldr: 'TL;DR',
    comments: 'Comments',
  },

  tags: {
    title: 'Tags',
    description: 'Browse posts by tag',
    count: (n: number) => `${n} ${n === 1 ? 'post' : 'posts'}`,
    empty: 'No tags yet.',
    under: (tag: string) => `Posts tagged ${tag}`,
  },

  page: {
    title: (n: number) => `Posts · Page ${n}`,
    description: (n: number) => `Blog posts, page ${n}.`,
    heading: (n: number) => `Posts · Page ${n}`,
    prev: 'Previous',
    next: 'Next',
  },

  search: {
    title: 'Search',
    description: 'Full-text search',
    heading: 'Full-text search',
    placeholder: 'Type a keyword, e.g. routing, middleware, cache…',
    searching: 'Searching…',
    notFound: (term: string) => `No results for “${term}”.`,
    found: (n: number) => `${n} results found`,
    indexMissing: 'Search index not built yet — run `npm run build` first.',
  },

  about: {
    title: 'About',
    description: 'About this site and the author',
    kicker: 'About',
    heading: 'About this site',
    intro:
      'A static blog that organizes technical articles into "books". Every book has a clear table of contents — read chapters in order like a real book, or jump to any chapter.',
    tech: 'Built with Astro, content managed in Markdown, shipped as a fully static site with dark mode, full-text search and print-friendly book layouts.',
    authorHeading: 'Author',
    author:
      'Geektutu writes code mostly in Go and TypeScript, and likes to organize tutorial series into online books. All companion code is open-sourced on GitHub.',
    subscribe: 'Subscribe & Contact',
    rss: 'RSS feed',
    statsBook: 'books',
    statsChapter: 'chapters',
    statsTag: 'tags',
  },

  tip: {
    title: 'Found this helpful? Buy me a coffee ☕',
    alipay: 'Alipay',
    wechat: 'WeChat',
  },

  misc: {
    statsVisits: 'Total visits',
    statsPageViews: 'Page views',
  },
};

export type Dict = typeof zh;

const dicts: Record<Lang, Dict> = { zh, en };

export function getDict(lang: Lang): Dict {
  return dicts[lang];
}

/** 语言切换的机械映射：/x ↔ /en/x（slug 双语一致的前提下成立） */
export function counterpartPath(pathname: string, lang: Lang): string {
  if (lang === 'en') {
    return pathname.replace(/^\/en(?=\/|$)/, '') || '/';
  }
  return `/en${pathname === '/' ? '/' : pathname}`;
}
