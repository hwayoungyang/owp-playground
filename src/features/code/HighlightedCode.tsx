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

export function HighlightedCode({
  html,
  highlight,
}: {
  readonly html: string;
  readonly highlight?: { readonly line: number; readonly endLine: number };
}) {
  const code = useMemo(() => {
    const document = new DOMParser().parseFromString(html, 'text/html');
    if (highlight) {
      const lines: ReactNode[][] = [[]];
      let segment = 0;
      function append(node: Node, classes: readonly string[] = []) {
        if (node instanceof Text) {
          for (const [index, text] of (node.textContent ?? '').split('\n').entries()) {
            if (index) lines.push([]);
            lines
              .at(-1)
              ?.push(
                classes.reduceRight<ReactNode>(
                  (child, className) => createElement('span', { key: segment++, className }, child),
                  text,
                ),
              );
          }
        } else if (node instanceof Element && node.tagName === 'SPAN') {
          Array.from(node.childNodes).forEach((child) =>
            append(child, [...classes, node.className]),
          );
        } else if (node.textContent) append(document.createTextNode(node.textContent), classes);
      }
      Array.from(document.body.childNodes).forEach((node) => append(node));
      return createElement(
        'code',
        null,
        ...lines.flatMap((line, index) => [
          createElement(
            'span',
            {
              key: index,
              className: 'code-line',
              'data-line': index + 1,
              'data-highlighted':
                index + 1 >= highlight.line && index + 1 <= highlight.endLine ? 'true' : undefined,
            },
            ...line,
          ),
          ...(index < lines.length - 1 ? ['\n'] : []),
        ]),
      );
    }
    return createElement('code', null, ...Array.from(document.body.childNodes, renderToken));
  }, [html, highlight]);
  return code;
}
