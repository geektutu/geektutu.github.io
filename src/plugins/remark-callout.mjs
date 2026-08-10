/**
 * remark 插件：将 containerDirective（:::note / :::tip / :::warn）转换为提示框。
 * 渲染为 <div class="callout callout-note"><p class="callout-title">…</p>…</div>
 */
const TYPES = new Set(['note', 'tip', 'warn']);
const DEFAULTS = { note: '备注', tip: '提示', warn: '注意' };

export default function remarkCallout() {
  return (tree) => {
    walk(tree);
  };
}

function walk(node) {
  if (!node.children) return;
  for (const child of node.children) {
    if (child.type === 'containerDirective' && TYPES.has(child.name)) {
      toCallout(child);
    }
    walk(child);
  }
}

function toCallout(node) {
  const data = node.data || (node.data = {});
  data.hName = 'div';
  data.hProperties = { className: ['callout', `callout-${node.name}`] };

  let hasTitle = false;
  for (const child of node.children) {
    if (child.type === 'paragraph' && child.data?.directiveLabel) {
      child.data = {
        ...(child.data || {}),
        hProperties: { className: ['callout-title'] },
      };
      hasTitle = true;
    }
  }

  if (!hasTitle) {
    node.children.unshift({
      type: 'paragraph',
      data: { hProperties: { className: ['callout-title'] } },
      children: [{ type: 'text', value: DEFAULTS[node.name] }],
    });
  }
}
