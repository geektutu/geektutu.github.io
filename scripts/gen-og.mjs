/**
 * 生成全站默认社交分享图 public/og-default.png（1200×630）。
 * 使用站点品牌色（paper/ink/accent），带圆形头像与标题文案。
 * 一次性资源生成：npm run gen-og（产物提交到仓库，不参与每次构建）。
 */
import sharp from 'sharp';

const W = 1200;
const H = 630;
const ICON = 176;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="#faf6ef"/>
  <rect x="0" y="0" width="${W}" height="10" fill="#c4532a"/>
  <rect x="0" y="${H - 10}" width="${W}" height="10" fill="#c4532a" opacity="0.35"/>
  <circle cx="${W / 2}" cy="${90 + ICON / 2}" r="${ICON / 2 + 14}" fill="none" stroke="#c4532a" stroke-width="4" opacity="0.55"/>
  <text x="${W / 2}" y="382" text-anchor="middle" font-family="PingFang SC, Hiragino Sans GB, Noto Sans CJK SC, sans-serif" font-size="96" font-weight="700" fill="#1a1815">极客兔兔</text>
  <text x="${W / 2}" y="458" text-anchor="middle" font-family="PingFang SC, Hiragino Sans GB, Noto Sans CJK SC, sans-serif" font-size="38" fill="#6f675c">把技术文章组织成一本本可以在线阅读的书</text>
  <text x="${W / 2}" y="530" text-anchor="middle" font-family="Menlo, monospace" font-size="30" fill="#c4532a">geektutu.com</text>
</svg>`;

const icon = await sharp('public/icon.png')
  .resize(ICON, ICON)
  .composite([
    {
      input: Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${ICON}" height="${ICON}"><circle cx="${ICON / 2}" cy="${ICON / 2}" r="${ICON / 2}" fill="#fff"/></svg>`
      ),
      blend: 'dest-in',
    },
  ])
  .png()
  .toBuffer();

await sharp(Buffer.from(svg))
  .composite([{ input: icon, left: Math.round((W - ICON) / 2), top: 90 }])
  .png()
  .toFile('public/og-default.png');

console.log('✔ 已生成 public/og-default.png (1200x630)');
