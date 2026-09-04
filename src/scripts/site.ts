// 站点公共脚本：主题切换、阅读进度、目录高亮。
// 全站每页加载一次，元素不存在时自动跳过。

// 主题切换
const toggle = document.getElementById('theme-toggle');
toggle?.addEventListener('click', () => {
  const root = document.documentElement;
  const isDark = root.classList.toggle('dark');
  try {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  } catch (e) {}
});

// 阅读进度条
const readingBar = document.getElementById('reading-bar');
function updateReadingBar() {
  if (!readingBar) return;
  const doc = document.documentElement;
  const max = doc.scrollHeight - window.innerHeight;
  const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
  readingBar.style.width = pct + '%';
}
window.addEventListener('scroll', updateReadingBar, { passive: true });
window.addEventListener('resize', updateReadingBar);
updateReadingBar();

// 侧边栏滚动到当前章节，保证激活项可见
const tocScroller = document.querySelector<HTMLElement>('.book-toc-scroll');
const tocActive = document.querySelector<HTMLElement>('.book-toc [aria-current="page"]');
if (tocScroller && tocActive) {
  const target = tocActive.offsetTop - tocScroller.clientHeight / 2 + tocActive.offsetHeight / 2;
  tocScroller.scrollTop = Math.max(0, target);
}

// 本章目录高亮当前小节
const tocLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('#section-toc a'));
const tocHeadings = tocLinks
  .map((a) => document.getElementById(a.getAttribute('href')!.slice(1)))
  .filter((h): h is HTMLElement => Boolean(h));

function updateTocActive() {
  const offset = 120;
  let current: HTMLElement | null = null;
  for (const h of tocHeadings) {
    if (h.getBoundingClientRect().top <= offset) current = h;
  }
  tocLinks.forEach((a) => a.classList.remove('active'));
  if (current) {
    tocLinks.find((a) => a.getAttribute('href') === '#' + current!.id)?.classList.add('active');
  }
}
window.addEventListener('scroll', updateTocActive, { passive: true });
updateTocActive();
