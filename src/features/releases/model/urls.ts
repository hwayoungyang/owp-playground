/** 루트 기준 문서 링크를 현재 빌드의 공개 경로에 연결합니다. */
export function withPublicBase(value: string, basePath: string): string {
  if (!value.startsWith('/') || value.startsWith('//') || basePath === '/') return value;
  if (value.startsWith(basePath)) return value;
  return `${basePath}${value.slice(1)}`;
}

export function markdownWithPublicBase(markdown: string, basePath: string): string {
  let fence: string | undefined;
  return markdown
    .split('\n')
    .map((line) => {
      const marker = /^\s*(`{3,}|~{3,})/.exec(line)?.[1];
      if (marker) {
        if (!fence) fence = marker[0];
        else if (marker[0] === fence) fence = undefined;
        return line;
      }
      return fence
        ? line
        : line.replace(
            /\]\((\/(?!\/)[^\s)]+)\)/g,
            (_match, url: string) => `](${withPublicBase(url, basePath)})`,
          );
    })
    .join('\n');
}

export function isSamePlaygroundDocument(href: string, currentHref: string): boolean {
  const current = new URL(currentHref);
  const target = new URL(href, current);
  return target.origin === current.origin && target.pathname === current.pathname;
}
