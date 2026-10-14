import { createElement, type ReactNode, useMemo } from 'react';

function renderToken(node: Node): ReactNode {
  if (node instanceof Text) return node.textContent;
  if (node instanceof Element && node.tagName === 'SPAN') {
    return createElement(
      'span',
      { className: node.className },
      ...Array.from(node.childNodes, renderToken),
    );
  }
  return node.textContent;
}

export function HighlightedCode({ html }: { readonly html: string }) {
  const code = useMemo(() => {
    const document = new DOMParser().parseFromString(html, 'text/html');
    return createElement('code', null, ...Array.from(document.body.childNodes, renderToken));
  }, [html]);
  return code;
}
