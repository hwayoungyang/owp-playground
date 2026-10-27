export type SourceToken = {
  readonly text: string;
  readonly start: number;
  readonly end: number;
  readonly scopes: readonly string[];
};

const entities: Readonly<Record<string, string>> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#x27;': "'",
};

function decode(text: string) {
  return text.replace(/&(amp|lt|gt|quot|#x27);/g, (entity) => entities[entity] ?? entity);
}

export function isLiteralToken(token: SourceToken) {
  const boundary = token.scopes.findLast((scope) =>
    /hljs-(comment|string|regexp|subst)/.test(scope),
  );
  return boundary !== undefined && boundary !== 'hljs-subst';
}

/** highlight.js가 생성한 span만 읽어 원문의 위치와 구문 범위를 연결합니다. */
export function sourceTokens(html: string): readonly SourceToken[] {
  const scopes: string[] = [];
  const tokens: SourceToken[] = [];
  let offset = 0;
  for (const part of html.match(/<span\b[^>]*>|<\/span>|[^<]+/g) ?? []) {
    if (part.startsWith('<span')) scopes.push(part.match(/class="([^"]*)"/)?.[1] ?? '');
    else if (part === '</span>') scopes.pop();
    else {
      const text = decode(part);
      const active = scopes.at(-1) ?? '';
      if (!/hljs-(comment|string|regexp)/.test(active)) {
        for (const match of text.matchAll(/[$\p{ID_Start}][$\p{ID_Continue}]*|=>|\?\.|[^\s]/gu)) {
          const start = offset + match.index;
          tokens.push({ text: match[0], start, end: start + match[0].length, scopes: [...scopes] });
        }
      } else if (/^['"]/.test(text)) {
        tokens.push({ text, start: offset, end: offset + text.length, scopes: [...scopes] });
      }
      offset += text.length;
    }
  }
  return tokens;
}

/** 이스케이프된 기존 출력에 이름의 span만 추가하며 원문을 다시 생성하지 않습니다. */
export function emphasizeTokens(html: string, positions: ReadonlySet<number>) {
  let offset = 0;
  return html.replace(/<span\b[^>]*>|<\/span>|[^<]+/g, (part) => {
    if (part.startsWith('<')) return part;
    const start = offset;
    offset += decode(part).length;
    let decodedOffset = 0;
    return part.replace(
      /&(amp|lt|gt|quot|#x27);|[$\p{ID_Start}][$\p{ID_Continue}]*|[^]/gu,
      (text) => {
        const position = start + decodedOffset;
        decodedOffset += decode(text).length;
        return positions.has(position) ? `<span class="code-api-symbol">${text}</span>` : text;
      },
    );
  });
}
