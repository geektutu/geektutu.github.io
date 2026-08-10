// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import remarkDirective from 'remark-directive';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkCallout from './src/plugins/remark-callout.mjs';

// https://astro.build/config
export default defineConfig({
    site: 'https://geektutu.com',
    trailingSlash: 'ignore',
    vite: {
        plugins: [tailwindcss()],
    },
    integrations: [sitemap()],
    markdown: {
        remarkPlugins: [remarkDirective, remarkCallout, remarkMath],
        rehypePlugins: [rehypeKatex],
        shikiConfig: {
            theme: 'github-light',
            wrap: true,
        },
    },
});
